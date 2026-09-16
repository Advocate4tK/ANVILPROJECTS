-- ============================================================================
-- Referee Blasts: the sending record
-- 2026-09-16
--
-- Referee Blasts (referee-blasts.html) has had a working composer since July —
-- filters, merge tokens, preview, opt-out exclusion — with the Send button
-- disabled because there was no mail provider. Resend is now verified for
-- referee-tool.com and the key sits in an Edge Function secret. This migration
-- is everything the sender needs to REMEMBER what it did.
--
-- ⚠️ RUN THIS BEFORE deploying send-blast or touching referee-blasts.html.
--    PostgREST rejects an entire select if any named column is missing, so a
--    page that mentions unsubscribe_token before this runs is a public outage.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. An unsubscribe token on every referee
--
-- The link in every footer has to identify one person. The obvious
-- ?id=1495 is a trap: ids are sequential, so anyone holding one link can count
-- upward and opt out the whole roster. A random uuid is neither guessable nor
-- enumerable.
--
-- No backfill UPDATE is needed. On PG11+ (Supabase is on 15) ADD COLUMN with a
-- VOLATILE default such as gen_random_uuid() rewrites the table and gives
-- every existing row its own distinct value. An UPDATE here would do nothing.
-- ---------------------------------------------------------------------------
ALTER TABLE referees
    ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS referees_unsubscribe_token_idx
    ON referees (unsubscribe_token);

COMMENT ON COLUMN referees.unsubscribe_token IS
    'Random key carried by the unsubscribe link in every blast footer. Never '
    'the referee id — that is enumerable.';


-- ---------------------------------------------------------------------------
-- 2. blast_log — one row per blast
--
-- Subject and body live HERE, once, not on every recipient row. A long
-- message body times a few thousand sends is real space for no reason.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blast_log (
    id              bigserial    PRIMARY KEY,
    sent_at         timestamptz  NOT NULL DEFAULT now(),
    sent_by         uuid,                          -- auth.users id of the assignor
    sent_by_name    text,
    subject         text         NOT NULL,
    body            text         NOT NULL,
    where_text      text,                          -- "28 towns + pool EAST CENTRAL"
    recipient_count int          NOT NULL DEFAULT 0,
    guardians_cc    boolean      NOT NULL DEFAULT false
);

COMMENT ON TABLE blast_log IS
    'One row per blast sent from referee-blasts.html. Answers "what have we '
    'sent this season". Per-address outcomes are in blast_recipients.';


-- ---------------------------------------------------------------------------
-- 3. blast_recipients — one row per address, per blast
--
-- email is STORED, not joined: it records where the message actually went at
-- send time. If a referee changes address next month the log must not
-- retroactively change with them.
--
-- referee_id is deliberately NOT a foreign key. A log that disappears when
-- its subject is deleted is not a log.
--
-- blast_id DOES cascade: recipient rows are meaningless without their blast.
--
-- status starts at 'queued'. If the function dies mid-send, rows stuck at
-- queued show exactly where it stopped instead of leaving silence.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blast_recipients (
    id           bigserial  PRIMARY KEY,
    blast_id     bigint     NOT NULL REFERENCES blast_log(id) ON DELETE CASCADE,
    referee_id   bigint,
    email        text       NOT NULL,
    is_guardian  boolean    NOT NULL DEFAULT false,  -- a parent copy, not the referee
    status       text       NOT NULL DEFAULT 'queued'
                            CHECK (status IN ('queued','sent','failed','skipped')),
    provider_id  text,                                -- Resend message id, for bounce lookups
    error        text
);

CREATE INDEX IF NOT EXISTS blast_recipients_blast_idx   ON blast_recipients (blast_id);
CREATE INDEX IF NOT EXISTS blast_recipients_referee_idx ON blast_recipients (referee_id);

COMMENT ON TABLE blast_recipients IS
    'One row per address per blast. Answers "did Ross get that one".';


-- ---------------------------------------------------------------------------
-- 4. Row-level security
--
-- ⚠️ Every table Supabase creates is reachable through PostgREST. Without RLS,
--    blast_log — every message body and every address ever mailed — is
--    readable by the anon key, and the anon key is in a public repo.
--
-- Policy names are TABLE-SPECIFIC on purpose. A generic name such as
-- "anon_insert" collides across tables and silently breaks a policy that was
-- working somewhere else. That has bitten this project before.
--
-- Who may do what:
--   * logged-in assignors (authenticated)  read + insert both tables
--   * the Edge Function (service_role)     bypasses RLS by definition — it
--                                          writes the per-recipient outcomes
--   * the public (anon)                    nothing at all
-- ---------------------------------------------------------------------------
ALTER TABLE blast_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE blast_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blast_log_select_authenticated ON blast_log;
CREATE POLICY blast_log_select_authenticated ON blast_log
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS blast_log_insert_authenticated ON blast_log;
CREATE POLICY blast_log_insert_authenticated ON blast_log
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS blast_recipients_select_authenticated ON blast_recipients;
CREATE POLICY blast_recipients_select_authenticated ON blast_recipients
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS blast_recipients_insert_authenticated ON blast_recipients;
CREATE POLICY blast_recipients_insert_authenticated ON blast_recipients
    FOR INSERT TO authenticated WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 5. The unsubscribe action itself
--
-- unsubscribe.html is a public page hit by someone who is NOT logged in, so
-- it cannot UPDATE referees directly — referees is RLS-protected and anon has
-- no write there. Instead it calls this function, which runs with the
-- definer's rights and does exactly one thing: flip the opt-in for the row
-- whose token matches. Nothing else on the row is reachable through it.
--
-- Returns true if a row was flipped, false if the token matched nothing —
-- so the page can say "you're unsubscribed" or "that link isn't valid".
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION unsubscribe_by_token(p_token uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH flipped AS (
        UPDATE referees
        SET    email_opt_in = false
        WHERE  unsubscribe_token = p_token
        RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM flipped);
$$;

REVOKE ALL    ON FUNCTION unsubscribe_by_token(uuid) FROM public;
GRANT EXECUTE ON FUNCTION unsubscribe_by_token(uuid) TO anon, authenticated;

COMMENT ON FUNCTION unsubscribe_by_token(uuid) IS
    'The only write path unsubscribe.html has. Flips email_opt_in on the one '
    'referee whose token matches. SECURITY DEFINER because anon cannot touch '
    'referees directly.';


-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
SELECT count(*) AS referees,
       count(unsubscribe_token) AS with_token,
       count(DISTINCT unsubscribe_token) AS distinct_tokens
FROM   referees;
--  expected: all three numbers equal (every referee has one, all different)

SELECT tablename, rowsecurity
FROM   pg_tables
WHERE  tablename IN ('blast_log','blast_recipients');
--  expected: both rows  rowsecurity = true

SELECT tablename, policyname, cmd, roles
FROM   pg_policies
WHERE  tablename IN ('blast_log','blast_recipients')
ORDER  BY tablename, policyname;
--  expected: 4 rows, all roles = {authenticated}, names all start with the table name

SELECT proname, prosecdef
FROM   pg_proc
WHERE  proname = 'unsubscribe_by_token';
--  expected: one row, prosecdef = true


-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- DROP FUNCTION IF EXISTS unsubscribe_by_token(uuid);
-- DROP TABLE IF EXISTS blast_recipients;
-- DROP TABLE IF EXISTS blast_log;
-- DROP INDEX IF EXISTS referees_unsubscribe_token_idx;
-- ALTER TABLE referees DROP COLUMN IF EXISTS unsubscribe_token;
