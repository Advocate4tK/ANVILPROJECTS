-- Griswold Payment Portal — Test Data
-- Seeds 3 past games with assigned refs so Jeff Green's portal has something to show
-- SAFE: only touches unassigned Griswold games
-- Run in Supabase SQL Editor — rollback block at the bottom

-- ── Step 1: Preview what will be touched ─────────────────────────────────────
-- SELECT id, date, "Home Team", "Away Team", "Age Group", "Center Referee"
-- FROM games
-- WHERE LOWER("Source Club") LIKE '%griswold%'
-- ORDER BY date LIMIT 10;

-- ── Step 2: Backdate + assign refs on 3 games ────────────────────────────────

-- Game 1 — last week, CR + AR1
UPDATE games
SET    date             = (CURRENT_DATE - INTERVAL '7 days')::date,
       "Center Referee" = 'Sean Murphy',
       "AR 1"           = 'Zach Gauthier'
WHERE  id = (
    SELECT id FROM games
    WHERE  LOWER("Source Club") LIKE '%griswold%'
      AND  ("Center Referee" IS NULL OR "Center Referee" = '')
    ORDER BY id LIMIT 1 OFFSET 0
);

-- Game 2 — last week, CR only
UPDATE games
SET    date             = (CURRENT_DATE - INTERVAL '7 days')::date,
       "Center Referee" = 'Madison Letourneau'
WHERE  id = (
    SELECT id FROM games
    WHERE  LOWER("Source Club") LIKE '%griswold%'
      AND  ("Center Referee" IS NULL OR "Center Referee" = '')
    ORDER BY id LIMIT 1 OFFSET 1
);

-- Game 3 — two weeks ago, CR + AR1 + AR2
UPDATE games
SET    date             = (CURRENT_DATE - INTERVAL '14 days')::date,
       "Center Referee" = 'Ryan Pelletier',
       "AR 1"           = 'Nick Bouchard',
       "AR 2"           = 'Abby Wentworth'
WHERE  id = (
    SELECT id FROM games
    WHERE  LOWER("Source Club") LIKE '%griswold%'
      AND  ("Center Referee" IS NULL OR "Center Referee" = '')
    ORDER BY id LIMIT 1 OFFSET 2
);

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT id, date, "Home Team", "Age Group",
       "Center Referee", "AR 1", "AR 2", "Payment Status"
FROM   games
WHERE  LOWER("Source Club") LIKE '%griswold%'
  AND  "Center Referee" IS NOT NULL
  AND  "Center Referee" != ''
ORDER BY date DESC;

-- ── ROLLBACK ──────────────────────────────────────────────────────────────────
-- UPDATE games
-- SET    date             = '2026-05-03',
--        "Center Referee" = NULL,
--        "AR 1"           = NULL,
--        "AR 2"           = NULL
-- WHERE  LOWER("Source Club") LIKE '%griswold%'
--   AND  date < CURRENT_DATE;
