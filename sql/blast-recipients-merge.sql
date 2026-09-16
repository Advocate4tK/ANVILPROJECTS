-- ============================================================================
-- blast_recipients.merge — what each row needs to be re-sent on its own
-- 2026-09-16, the afternoon after blast-log.sql
--
-- WHY: the first real blast (NECONN OPENINGS, NorthEast, 202 addresses) hit
--   Resend's 100/day free cap at 146 and 56 rows failed. Retrying them means
--   sending the SAME message to those 56 with their own {{first}} and
--   unsubscribe link — and the function only had their email address.
--   Everything else (name, town, token, whose parent this is) lived in the
--   page's memory and was gone.
--
-- So each row now carries its own merge data. A retry is self-contained:
-- the function reads the failed rows, rebuilds each greeting, sends.
--
-- ⚠️ RUN BEFORE deploying the rebuilt send-blast — it inserts this column.
-- ============================================================================

ALTER TABLE blast_recipients
    ADD COLUMN IF NOT EXISTS merge jsonb;

COMMENT ON COLUMN blast_recipients.merge IS
    '{name, town, token, minor_name} — enough to rebuild this one email '
    'without the page. What a retry runs on.';

-- The 56 that failed today have no merge data (the column didn't exist).
-- Backfill from the referee record so they CAN be retried. Guardian rows
-- take the child's name — that is what the greeting and footer use.
UPDATE blast_recipients br
SET    merge = jsonb_build_object(
           'name',       r.name,
           'town',       r.city,
           'token',      r.unsubscribe_token,
           'minor_name', CASE WHEN br.is_guardian THEN r.name ELSE '' END)
FROM   referees r
WHERE  br.referee_id = r.id
  AND  br.merge IS NULL;


-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------
SELECT status, count(*) AS n, count(merge) AS with_merge
FROM   blast_recipients
WHERE  blast_id = (SELECT max(id) FROM blast_log)
GROUP  BY status;
--  expected: every row has merge (n = with_merge on each line)

-- ROLLBACK
-- ALTER TABLE blast_recipients DROP COLUMN IF EXISTS merge;
