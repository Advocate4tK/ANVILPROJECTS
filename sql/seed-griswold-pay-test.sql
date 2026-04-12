-- Griswold Payment Portal — Test Data
-- Seeds 3 past games with assigned refs so Jeff Green's portal has something to show
-- SAFE: only touches games with "Griswold" in Source Club and no refs assigned yet
-- Run in Supabase SQL Editor — roll back by running the ROLLBACK block at the bottom

-- ── Step 1: Find existing Griswold game IDs ───────────────────────────────────
-- Run this first to see what's available:
-- SELECT id, "Date", "Home Team", "Away Team", "Age Group", "Center Referee"
-- FROM games
-- WHERE LOWER("Source Club") LIKE '%griswold%'
-- ORDER BY "Date" LIMIT 10;

-- ── Step 2: Assign refs + set past dates on 3 games ──────────────────────────
-- Replace the IDs below with real IDs from Step 1

-- Game 1 — set to last Saturday, assign a CR + AR
UPDATE games
SET    "Date"            = (CURRENT_DATE - INTERVAL '7 days')::date,
       "Center Referee"  = 'Sean Murphy',
       "AR 1"            = 'Zach Gauthier'
WHERE  id = (
    SELECT id FROM games
    WHERE  LOWER("Source Club") LIKE '%griswold%'
      AND  ("Center Referee" IS NULL OR "Center Referee" = '')
    ORDER BY id LIMIT 1 OFFSET 0
);

-- Game 2 — set to last Saturday, assign a CR only
UPDATE games
SET    "Date"            = (CURRENT_DATE - INTERVAL '7 days')::date,
       "Center Referee"  = 'Madison Letourneau'
WHERE  id = (
    SELECT id FROM games
    WHERE  LOWER("Source Club") LIKE '%griswold%'
      AND  ("Center Referee" IS NULL OR "Center Referee" = '')
    ORDER BY id LIMIT 1 OFFSET 1
);

-- Game 3 — set to two weeks ago, assign CR + 2 ARs
UPDATE games
SET    "Date"            = (CURRENT_DATE - INTERVAL '14 days')::date,
       "Center Referee"  = 'Ryan Pelletier',
       "AR 1"            = 'Nick Bouchard',
       "AR 2"            = 'Abby Wentworth'
WHERE  id = (
    SELECT id FROM games
    WHERE  LOWER("Source Club") LIKE '%griswold%'
      AND  ("Center Referee" IS NULL OR "Center Referee" = '')
    ORDER BY id LIMIT 1 OFFSET 2
);

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT id, "Date", "Home Team", "Age Group",
       "Center Referee", "AR 1", "AR 2", "Payment Status"
FROM   games
WHERE  LOWER("Source Club") LIKE '%griswold%'
  AND  "Center Referee" IS NOT NULL
  AND  "Center Referee" != ''
ORDER BY "Date" DESC;

-- ── ROLLBACK (run to undo test data) ─────────────────────────────────────────
-- UPDATE games
-- SET "Date" = '2026-05-03',   -- put back original dates
--     "Center Referee" = NULL,
--     "AR 1" = NULL,
--     "AR 2" = NULL
-- WHERE LOWER("Source Club") LIKE '%griswold%'
--   AND "Date" < CURRENT_DATE;
