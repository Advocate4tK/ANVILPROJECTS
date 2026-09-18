-- ============================================================================
-- SMS consent — real consent, not a default
-- 2026-09-18
--
-- referees.sms_opt_in has read TRUE on all 3,456 rows since July, from
-- `default true` in referee-pools-schema.sql. Nobody was ever asked. Wiring
-- texting to that column would have texted every referee in Connecticut on
-- the strength of a schema default. TCPA consent is prior, express, written,
-- per number — a default is none of those.
--
-- So: consent is a TIMESTAMP of when a person said yes on the availability
-- form, one for the referee and one for the guardian (a minor's consent is
-- the parent's, not the kid's). NULL means never asked or said no. Nothing
-- texts a NULL. The old boolean is set false everywhere and kept only so
-- existing reads don't break; the timestamps are the truth.
--
-- Tod, 2026-09-18: "we should do the availability form check... meanwhile
-- lets wire up the ref blast page with an option for this as well as the
-- assignor workstations"
-- ============================================================================

ALTER TABLE referees
    ADD COLUMN IF NOT EXISTS sms_consent_at          timestamptz,
    ADD COLUMN IF NOT EXISTS guardian_sms_consent_at timestamptz;

COMMENT ON COLUMN referees.sms_consent_at IS
    'When the referee ticked "text me about assignments" on the availability form. NULL = no consent. The only thing that permits a text to phone.';
COMMENT ON COLUMN referees.guardian_sms_consent_at IS
    'When the guardian ticked it. For a minor this is the consent that counts. NULL = no consent. Permits a text to "Guardian Phone".';

-- The July default was never a yes.
UPDATE referees SET sms_opt_in = false WHERE sms_opt_in = true;

-- Speed the "who can I text" query on the blast page and the workstation.
CREATE INDEX IF NOT EXISTS referees_sms_consent_idx          ON referees (sms_consent_at)          WHERE sms_consent_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS referees_guardian_sms_consent_idx ON referees (guardian_sms_consent_at) WHERE guardian_sms_consent_at IS NOT NULL;

-- Text log: what went to whom, so "did Ross get that text" is answerable
-- the same way it is for email.
CREATE TABLE IF NOT EXISTS sms_log (
    id           bigserial   PRIMARY KEY,
    sent_at      timestamptz NOT NULL DEFAULT now(),
    sent_by      uuid,
    sent_by_name text,
    kind         text        NOT NULL,      -- 'assignment' | 'blast'
    game_id      bigint,
    blast_id     bigint,
    referee_id   bigint,
    to_phone     text        NOT NULL,
    is_guardian  boolean     NOT NULL DEFAULT false,
    body         text        NOT NULL,
    status       text        NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','skipped')),
    provider_id  text,
    error        text
);
CREATE INDEX IF NOT EXISTS sms_log_referee_idx ON sms_log (referee_id);
CREATE INDEX IF NOT EXISTS sms_log_game_idx    ON sms_log (game_id);

ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sms_log_select_authenticated ON sms_log;
CREATE POLICY sms_log_select_authenticated ON sms_log FOR SELECT TO authenticated USING (true);


-- VERIFY
SELECT count(*) FILTER (WHERE sms_opt_in)                       AS old_bool_true,
       count(*) FILTER (WHERE sms_consent_at IS NOT NULL)          AS ref_consented,
       count(*) FILTER (WHERE guardian_sms_consent_at IS NOT NULL) AS guardian_consented
FROM   referees;
--  expected today: 0 / 0 / 0. Every number above zero from here on is a real yes.

SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'sms_log';
--  expected: true


-- ROLLBACK
-- DROP TABLE IF EXISTS sms_log;
-- ALTER TABLE referees DROP COLUMN IF EXISTS sms_consent_at, DROP COLUMN IF EXISTS guardian_sms_consent_at;
-- (sms_opt_in stays false — restoring the July default would be restoring a lie)
