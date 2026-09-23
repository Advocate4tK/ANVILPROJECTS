-- ============================================================================
-- Rewrite existing availability notes into Eric's short form
-- 2026-09-22
--
-- New submissions already write "U10 · Fri · Sep 25 · 7:15 PM · RTCT10235".
-- This brings the 157 notes already on file into the same shape so the column
-- reads the same all the way down.
--
-- Eric Baughman, verbatim: "I don't even care to see the team names / Or the
-- word 'interested' / U10 - Fri Sep 25 - 7:15pm - that would be ideal."
--
-- ⚠️ THE REFEREE'S OWN WORDS ARE NOT OURS TO DELETE.
--   12 of these notes have text the referee typed after the generated
--   sentence — "Would like to center this game", "Already reffing a 1:00
--   travel...can stay for the 2:00 game", "and Sun. Sep 27 at 3pm". That is
--   somebody telling their assignor something. regexp_replace is used
--   deliberately because it replaces ONLY the part that matches and leaves
--   the rest of the string exactly as it was.
--
-- ⚠️ BACKUP FIRST. Non-negotiable on a bulk update.
-- ============================================================================

CREATE TABLE IF NOT EXISTS availability_notes_backup_20260922 AS
    SELECT id, notes FROM availability WHERE notes IS NOT NULL;

-- How many we expect to touch, before touching anything.
SELECT count(*) AS will_rewrite
FROM   availability
WHERE  notes ~* '^\s*Interested in .+ vs .+ \(';
--  expected: 157


-- ── 1. Notes that already carry a game number ───────────────────────────────
--   "Interested in RTCT10256 East Haddam vs Team C (U10 Bronze) — Sat · Sep 26 @ 1:30 PM"
--     → "U10 Bronze · Sat · Sep 26 · 1:30 PM · RTCT10256"
UPDATE availability
SET    notes = regexp_replace(
           notes,
           '^\s*Interested in RTCT([0-9]+)\s+.+? vs .+? \(([^)]*)\)\s*[—–-]\s*([A-Za-z]{3})\s*·\s*([A-Za-z]{3}\s+[0-9]{1,2})\s*@\s*([0-9]{1,2}:[0-9]{2}\s*[AP]M)',
           '\2 · \3 · \4 · \5 · RTCT\1', 'i')
WHERE  notes ~* '^\s*Interested in RTCT[0-9]+\s+.+ vs .+ \(';

-- ── 2. Notes with no number, but the submission knows its game ──────────────
--   Rebuilt from the GAME rather than parsed, so the number is exact.
UPDATE availability a
SET    notes = regexp_replace(
           a.notes,
           '^\s*Interested in .+? vs .+? \(([^)]*)\)\s*[—–-]\s*([A-Za-z]{3})\s*·\s*([A-Za-z]{3}\s+[0-9]{1,2})\s*@\s*([0-9]{1,2}:[0-9]{2}\s*[AP]M)',
           '\1 · \2 · \3 · \4 · RTCT' || g.game_no, 'i')
FROM   games g
-- availability.game is TEXT and games.id is an integer, so compare as text.
--   Casting the other way (a.game::int) would throw on any non-numeric value
--   that ever landed in that column.
WHERE  g.id::text = a.game
  AND  a.notes ~* '^\s*Interested in .+ vs .+ \('
  AND  a.notes !~* '^\s*Interested in RTCT';

-- ── 3. Everything left: no number anywhere, so drop the prefix and keep ──────
--   what is actually useful. Better a short line with no number than a long
--   one nobody can read.
UPDATE availability
SET    notes = regexp_replace(
           notes,
           '^\s*Interested in .+? vs .+? \(([^)]*)\)\s*[—–-]\s*([A-Za-z]{3})\s*·\s*([A-Za-z]{3}\s+[0-9]{1,2})\s*@\s*([0-9]{1,2}:[0-9]{2}\s*[AP]M)',
           '\1 · \2 · \3 · \4', 'i')
WHERE  notes ~* '^\s*Interested in .+ vs .+ \(';

-- ── 4. Tidy: a note that had nothing after the sentence can be left with a ───
--   trailing separator or a stray leading period from ". Would like to..."
UPDATE availability
SET    notes = btrim(regexp_replace(notes, '\s*·\s*$', ''))
WHERE  notes ~ '·\s*$';


-- VERIFY
SELECT count(*) AS still_long
FROM   availability
WHERE  notes ~* '^\s*Interested in .+ vs .+ \(';
--  expected: 0

SELECT b.notes AS before, a.notes AS after
FROM   availability_notes_backup_20260922 b
JOIN   availability a ON a.id = b.id
WHERE  b.notes <> a.notes
ORDER  BY length(b.notes) DESC
LIMIT  12;
--  read these. The referee's own words must still be there on the ones that
--  had them — "Would like to center this game", "can stay for the 2:00 game".

SELECT count(*) AS changed
FROM   availability_notes_backup_20260922 b
JOIN   availability a ON a.id = b.id
WHERE  b.notes <> a.notes;
--  expected: 157


-- ROLLBACK — puts every note back exactly as it was
-- UPDATE availability a SET notes = b.notes
-- FROM availability_notes_backup_20260922 b WHERE b.id = a.id;
