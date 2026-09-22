-- ============================================================================
-- games.league — which competition a game actually belongs to
-- 2026-09-22
--
-- Eric had to move RTCT11570 out of "CT Northeast District Travel League" and
-- into "CJSA Connecticut Cup" by hand, because the export put NECONN's
-- district league on it. It was never a NECONN district game.
--
-- WHY THE CLUB CANNOT ANSWER THIS
--   js/central-assign-export.js has carried this note since 2026-08-29:
--     "A club can belong to MORE THAN ONE of these, so a single
--      clubs.ca_league cannot represent reality — the club needs a LIST,
--      and each game picks one from its club's list."
--   The list half shipped: clubs.ca_league is a JSON array, and WAM, RHAMYS
--   and Canterbury already hold two or three. The per-game pick never did, so
--   resolveLeague() takes ONE name per club and every travel game those clubs
--   play has been exporting under whichever one won. Quiet, and wrong.
--
-- WHY IT MATTERS MORE THAN IT LOOKS
--   Tod, 2026-09-22: "He was able to adjust the league, but he can't adjust
--   the fees." The League column and the fee columns travel together in the
--   same CSV row. A league we got wrong can be fixed in Central Assign; the
--   money cannot. So the league has to be right BEFORE export, not after.
--
-- NULL means "use the club's default", which is every game that exists today
-- and the right answer for ordinary league play. Only a game that leaves its
-- club's usual competition needs to say so.
-- ============================================================================

ALTER TABLE games            ADD COLUMN IF NOT EXISTS league text;
ALTER TABLE tournament_games ADD COLUMN IF NOT EXISTS league text;

COMMENT ON COLUMN games.league IS
    'The Central Assign league this one game belongs to, chosen from the club''s clubs.ca_league list. NULL = use the club default. A cup or cross-district fixture sets it; ordinary league play leaves it NULL.';
COMMENT ON COLUMN tournament_games.league IS
    'Same meaning as games.league.';

CREATE INDEX IF NOT EXISTS games_league_idx ON games (league) WHERE league IS NOT NULL;

-- The one we know about. Eric's correction, put back where it belongs so the
-- next export agrees with what Central Assign already holds.
UPDATE games SET league = 'CJSA Connecticut Cup' WHERE game_no = 11570;


-- VERIFY
SELECT game_no, date, "Home Team", "Away Team", "Source Club", game_type, is_cup, league
FROM   games WHERE league IS NOT NULL ORDER BY date;
--  expected: 11570 | 2026-09-26 | Gregorzek U12 | Sallam U12 | NECONN | Comp | true | CJSA Connecticut Cup

SELECT "Club Name", ca_league
FROM   clubs
WHERE  ca_league IS NOT NULL AND ca_league LIKE '[%,%'
ORDER  BY "Club Name";
--  the clubs with more than one league — every travel game they have exported
--  so far carried whichever name resolveLeague() happened to pick


-- ROLLBACK
-- ALTER TABLE games DROP COLUMN IF EXISTS league;
-- ALTER TABLE tournament_games DROP COLUMN IF EXISTS league;
