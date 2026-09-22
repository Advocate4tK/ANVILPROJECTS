-- ============================================================================
-- clubs.ca_league_primary — the league a club plays in week in, week out
-- 2026-09-22
--
-- Tod: "Every club should have their default that they belong to, and NECONN
-- is part of Northeast District. Primarily."
--
-- WHY THE LIST ISN'T ENOUGH
--   clubs.ca_league holds every league a club can appear in. The club portal
--   needs ONE of them pre-selected when a comp game is created, and it was
--   picking "the first non-cup", which is only ever a guess about ordering:
--     NECONN     ["CJSA Connecticut Cup", "CT Northeast District Travel League"]
--     Canterbury ["CT Central/North Central…", "CT Northeast…", "CT Southeast…"]
--   Canterbury has three districts and nothing in the data says which is home.
--
--   So the club says. A cup tie, or a fixture in a neighbouring district, stays
--   a deliberate choice; the ordinary case is already filled in.
--
-- BACKFILL
--   First league that is neither a cup nor the General Non-League escape hatch
--   — correct for every single-league club, and a sane starting point for the
--   three that have more. Those three want a human eye:
--   WAM, RHAMYS, Canterbury Athletic Association.
-- ============================================================================

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS ca_league_primary text;

COMMENT ON COLUMN clubs.ca_league_primary IS
    'The league this club plays in by default — pre-selected when a comp game is created. Must be one of the entries in ca_league. NULL falls back to the first non-cup entry.';

-- Backfill from the existing list.
UPDATE clubs
SET    ca_league_primary = sub.first_ordinary
FROM ( SELECT id,
              (SELECT x FROM jsonb_array_elements_text(ca_league::jsonb) AS x
               WHERE  x !~* '\ycup\y' AND x <> 'General Non-League Games'
               LIMIT  1) AS first_ordinary
       FROM   clubs
       WHERE  ca_league IS NOT NULL AND ca_league LIKE '[%' ) sub
WHERE  clubs.id = sub.id
  AND  sub.first_ordinary IS NOT NULL
  AND  clubs.ca_league_primary IS NULL;


-- VERIFY
SELECT "Club Name", ca_league_primary, ca_league
FROM   clubs
WHERE  ca_league IS NOT NULL
ORDER  BY "Club Name";
--  NECONN should read: CT Northeast District Travel League

SELECT "Club Name", ca_league_primary, ca_league
FROM   clubs
WHERE  ca_league LIKE '[%,%'
ORDER  BY "Club Name";
--  the three multi-league clubs — check these by hand in Entity Status


-- ROLLBACK
-- ALTER TABLE clubs DROP COLUMN IF EXISTS ca_league_primary;
