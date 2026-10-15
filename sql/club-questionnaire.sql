-- ============================================================================
-- CLUB ONBOARDING QUESTIONNAIRE — the table the handoff page writes to
-- 2026-10-15
--
-- Tod: "we can either complete it in the wizard or spin off the form to be
-- filled out and send that to the club or to the assignor to fill out."
--
-- WHY THIS TABLE AND NOT THE REAL ONES
--   The club's answers are a SUBMISSION, not truth. Tod reviews them and
--   promotes them. Writing straight into clubs/venues/pay_rates would mean a
--   club president's typo silently becomes the pay rate a referee gets paid.
--   The entity row already exists (created disabled in the Command Center);
--   this is the envelope their answers arrive in.
--
-- ⚠️ THE TOKEN IS THE CREDENTIAL. There is no login, by design — Eric opens
--   it, fills what he knows, and forwards the same link to the club. So the
--   token must be unguessable, and the page must never be able to see any
--   submission but its own. That is why it is a uuid and not the club slug.
--
-- ⚠️ ONE OPEN SUBMISSION PER ENTITY. Two live links for the same club means
--   two people filling in different answers and one of them silently losing.
--   Enforced below with a partial unique index.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================

CREATE TABLE IF NOT EXISTS club_questionnaires (
    id              bigserial PRIMARY KEY,

    -- The entity this is filling in. Exactly one of these is set.
    -- ⚠️ No FK on purpose: three different tables can own a submission
    -- (clubs / tournaments / events) and Postgres can't foreign-key a union.
    -- entity_kind says which table entity_id points at.
    entity_kind     text NOT NULL CHECK (entity_kind IN ('club', 'tournament', 'event')),
    entity_id       bigint NOT NULL,
    entity_name     text NOT NULL,          -- denormalised so the page can greet them without a join

    -- ⚠️ THE CREDENTIAL. Random, not derived from anything guessable.
    token           uuid NOT NULL DEFAULT gen_random_uuid(),

    -- Everything they type, by section. Shaped like:
    --   { "contacts": {...}, "venues": [...], "age_groups": [...], ... }
    -- Kept as jsonb rather than columns because the question set WILL change,
    -- and a half-finished submission must survive that change.
    answers         jsonb NOT NULL DEFAULT '{}'::jsonb,

    -- Which sections the filler has marked finished. Tod, 2026-10-14:
    -- "once a section is done on the page it can say complete."
    sections_done   text[] NOT NULL DEFAULT '{}',

    -- Lifecycle. 'open' = still being filled, 'submitted' = they pressed the
    -- button, 'promoted' = Tod has pulled it into the real tables,
    -- 'cancelled' = abandoned, frees the entity for a new link.
    status          text NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'submitted', 'promoted', 'cancelled')),

    -- Who it was meant for, so the Command Center can say "sent to Eric"
    -- rather than just "sent". Free text: it may be a club president who has
    -- no account and never will.
    sent_to         text,
    created_by      uuid,                   -- the admin who spun it off
    note            text,

    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    submitted_at    timestamptz,
    promoted_at     timestamptz
);

-- The page looks a submission up by token on every save, so this one matters.
CREATE UNIQUE INDEX IF NOT EXISTS club_questionnaires_token_idx
    ON club_questionnaires (token);

-- ⚠️ ONE LIVE LINK PER ENTITY. A second "Send Questionnaire" on a club that
-- already has one open must hand back the EXISTING link, not mint a rival.
-- Promoted and cancelled rows are excluded so a club can be re-sent next
-- season without deleting history.
CREATE UNIQUE INDEX IF NOT EXISTS club_questionnaires_one_open_idx
    ON club_questionnaires (entity_kind, entity_id)
    WHERE status IN ('open', 'submitted');

-- The Command Center reads this per entity to show sent / submitted.
CREATE INDEX IF NOT EXISTS club_questionnaires_entity_idx
    ON club_questionnaires (entity_kind, entity_id);

-- Keep updated_at honest — the page autosaves, and "when did they last touch
-- it" is how Tod decides who to chase.
CREATE OR REPLACE FUNCTION club_questionnaires_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS club_questionnaires_touch_trg ON club_questionnaires;
CREATE TRIGGER club_questionnaires_touch_trg
    BEFORE UPDATE ON club_questionnaires
    FOR EACH ROW EXECUTE FUNCTION club_questionnaires_touch();


-- ── THE TWO FUNCTIONS THE PUBLIC PAGE CALLS ─────────────────────────────────
-- ⚠️ The page is ANONYMOUS and holds only a token. It must never be able to
-- select the table directly, or one token would expose every club's answers.
-- These two are SECURITY DEFINER and take the token, so a caller can only
-- ever reach the single row they already hold the key to.

-- Read one submission by its token.
CREATE OR REPLACE FUNCTION questionnaire_get(p_token uuid)
RETURNS TABLE (
    entity_kind text, entity_name text, answers jsonb,
    sections_done text[], status text, updated_at timestamptz
)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT q.entity_kind, q.entity_name, q.answers, q.sections_done, q.status, q.updated_at
    FROM   club_questionnaires q
    WHERE  q.token = p_token
      AND  q.status IN ('open', 'submitted');
$$;

-- Save progress. Called on autosave and on submit.
-- ⛔ REFUSES A PROMOTED OR CANCELLED ROW. Once Tod has pulled the answers
-- into the real tables, a stale browser tab must not be able to keep writing
-- to it — the link is dead and should behave that way.
CREATE OR REPLACE FUNCTION questionnaire_save(
    p_token   uuid,
    p_answers jsonb,
    p_done    text[],
    p_submit  boolean DEFAULT false
)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER AS $$
    WITH saved AS (
        UPDATE club_questionnaires
        SET    answers       = coalesce(p_answers, answers),
               sections_done = coalesce(p_done, sections_done),
               status        = CASE WHEN p_submit THEN 'submitted' ELSE status END,
               submitted_at  = CASE WHEN p_submit THEN now() ELSE submitted_at END
        WHERE  token = p_token
          AND  status IN ('open', 'submitted')
        RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM saved);
$$;

GRANT EXECUTE ON FUNCTION questionnaire_get(uuid)                      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION questionnaire_save(uuid, jsonb, text[], boolean) TO anon, authenticated;


-- VERIFY ---------------------------------------------------------------------

-- Should list the table and both indexes.
SELECT indexname FROM pg_indexes WHERE tablename = 'club_questionnaires' ORDER BY indexname;

-- Both functions, both SECURITY DEFINER (prosecdef = true).
-- ⚠️ If either shows TWO rows, a CREATE OR REPLACE overloaded instead of
-- replacing and the old one is still live. Drop the wrong signature.
SELECT p.oid::regprocedure AS signature, p.prosecdef AS security_definer
FROM   pg_proc p
WHERE  p.proname IN ('questionnaire_get', 'questionnaire_save')
ORDER  BY 1;

-- Nothing in it yet.
SELECT count(*) AS submissions FROM club_questionnaires;


-- ROLLBACK -------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS questionnaire_save(uuid, jsonb, text[], boolean);
-- DROP FUNCTION IF EXISTS questionnaire_get(uuid);
-- DROP TABLE IF EXISTS club_questionnaires;
-- DROP FUNCTION IF EXISTS club_questionnaires_touch();
