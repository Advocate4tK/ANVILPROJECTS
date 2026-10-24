-- ============================================================================
-- questionnaire_save_sections — one section at a time, so two people on the
-- same link cannot overwrite each other
-- 2026-10-24
--
-- Tod: "each one needs to be different, so when you click go, it submits. That
-- way in case two people are sent the same form, and they hit at the same time
-- you wouldn't have a collision or a race factor."
--
-- ⚠️ THIS IS A LIVE BUG, NOT A FUTURE RISK. questionnaire_save writes the WHOLE
--   answers blob. The link is meant to be forwarded — club-questionnaire.sql
--   says so in as many words: "Eric opens it, fills what he knows, and forwards
--   the same link to the club." So two people holding it is the EXPECTED case.
--   Eric saves contacts, the club saves venues from a page loaded five minutes
--   earlier, and Eric's contacts are gone with nothing to show it happened.
--
-- ⭐ THE SECTION IS THE UNIT. answers is already shaped as one top-level key per
--   section ({contacts:…, venues:…, pay:…}), so `answers || p_sections` replaces
--   exactly the branches being saved and leaves every other one untouched. A
--   save to venues physically cannot reach contacts.
--
-- ⭐ sections_done IS A DELTA, NOT A SNAPSHOT. Sending the whole set back would
--   reintroduce the same race on the ticks. The page asserts the state only of
--   the sections it actually touched; everyone else's ticks survive.
--
-- ⚠️ 'promoted' IS NO LONGER AN ENDING. Tod and Eric, 2026-10-24: the link never
--   expires — "if a club or he wanted to edit, to pay rates or the crew rules or
--   the venues or the contacts, it would always just remain the same." So a
--   promoted row stays readable and writable; promotion becomes a sync point,
--   not a close. questionnaire_get is widened below for the same reason.
--   ⛔ 'cancelled' still refuses — that is an abandoned link and must stay dead.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================

CREATE OR REPLACE FUNCTION questionnaire_save_sections(
    p_token       uuid,
    -- { "venues": {...}, "contacts": {...} } — only what changed.
    p_sections    jsonb   DEFAULT '{}'::jsonb,
    -- Ticks to set and clear. Only ever the sections the caller touched.
    p_done_add    text[]  DEFAULT '{}',
    p_done_remove text[]  DEFAULT '{}',
    p_submit      boolean DEFAULT false
)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER AS $$
    WITH saved AS (
        UPDATE club_questionnaires q
        SET    answers = q.answers || coalesce(p_sections, '{}'::jsonb),
               sections_done = (
                   SELECT coalesce(array_agg(DISTINCT s ORDER BY s), '{}')
                   FROM   unnest(q.sections_done || coalesce(p_done_add, '{}')) AS s
                   WHERE  s <> ALL (coalesce(p_done_remove, '{}'))
               ),
               status = CASE WHEN p_submit THEN 'submitted' ELSE q.status END,
               -- ⭐ FIRST submit wins. The old function re-stamped this on every
               -- submit, so "when did they send it in" drifted later every time
               -- somebody reopened the link and pressed the button again.
               submitted_at = CASE
                   WHEN p_submit AND q.submitted_at IS NULL THEN now()
                   ELSE q.submitted_at END
        WHERE  q.token = p_token
          AND  q.status IN ('open', 'submitted', 'promoted')
        RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM saved);
$$;

COMMENT ON FUNCTION questionnaire_save_sections(uuid, jsonb, text[], text[], boolean) IS
    'Merge one or more answer SECTIONS, leaving every other section untouched. Replaces questionnaire_save, which wrote the whole blob and let two holders of the same link overwrite each other.';

-- ⚠️ WIDENED FOR THE PERMANENT LINK. A promoted row must still open — otherwise
-- the first promotion silently kills the club's only way to edit their own
-- details, which is the opposite of what the link is now for.
CREATE OR REPLACE FUNCTION questionnaire_get(p_token uuid)
RETURNS TABLE (
    entity_kind text, entity_name text, answers jsonb,
    sections_done text[], status text, updated_at timestamptz
)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT q.entity_kind, q.entity_name, q.answers, q.sections_done, q.status, q.updated_at
    FROM   club_questionnaires q
    WHERE  q.token = p_token
      AND  q.status IN ('open', 'submitted', 'promoted');
$$;

GRANT EXECUTE ON FUNCTION questionnaire_save_sections(uuid, jsonb, text[], text[], boolean)
    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION questionnaire_get(uuid) TO anon, authenticated;

-- ⛔ questionnaire_save IS LEFT IN PLACE ON PURPOSE. A browser tab open on the
-- old page keeps working until it is reloaded. Drop it once the new page has
-- been live for a day:
--     DROP FUNCTION IF EXISTS questionnaire_save(uuid, jsonb, text[], boolean);


-- VERIFY ---------------------------------------------------------------------

-- Both functions, both SECURITY DEFINER (prosecdef = true).
-- ⚠️ If questionnaire_get shows TWO rows, a CREATE OR REPLACE overloaded
-- instead of replacing and the old one is still live. Drop the wrong signature.
SELECT p.oid::regprocedure AS signature, p.prosecdef AS security_definer
FROM   pg_proc p
WHERE  p.proname IN ('questionnaire_get', 'questionnaire_save', 'questionnaire_save_sections')
ORDER  BY 1;

-- Proof it merges rather than replaces. Picks whatever submission exists,
-- writes a throwaway section, checks nothing else moved, then puts it back.
DO $$
DECLARE
    v_token uuid;
    v_before jsonb;
    v_after  jsonb;
BEGIN
    SELECT token, answers INTO v_token, v_before
    FROM club_questionnaires WHERE status IN ('open','submitted','promoted') LIMIT 1;

    IF v_token IS NULL THEN
        RAISE NOTICE 'No submissions to test against — skipped.';
        RETURN;
    END IF;

    PERFORM questionnaire_save_sections(
        v_token, '{"__probe__": {"ok": true}}'::jsonb, '{}', '{}', false);

    SELECT answers INTO v_after FROM club_questionnaires WHERE token = v_token;

    IF v_after - '__probe__' IS DISTINCT FROM v_before THEN
        RAISE EXCEPTION 'MERGE IS NOT CLEAN — other sections changed';
    END IF;

    UPDATE club_questionnaires SET answers = answers - '__probe__' WHERE token = v_token;
    RAISE NOTICE 'Merge verified clean on %', v_token;
END $$;


-- ROLLBACK -------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS questionnaire_save_sections(uuid, jsonb, text[], text[], boolean);
