-- ============================================================================
-- Game numbers — RTCT10001 and up
-- 2026-09-19
--
-- Tod: "it's just becoming clear that it's hard for people to find the
-- games in the system... if it's on the schedule, they go, oh, I can hear
-- it, I can find it." Arbiter has numbers. Central Assign has numbers.
-- Every system a referee has ever used has a number they can say on the
-- phone. Ours didn't: `Auto Number` is NULL on all 413 games, and the
-- EHFREC00126 scheme in buildGameNumber() never had anything to build from.
--
-- THE NUMBER
--   One integer, one shared sequence, starting at 10001. games and
--   tournament_games draw from the SAME sequence, because their ids overlap
--   (2876 is a club game AND a tournament game) and a number that means two
--   things is not a number. The page renders it as RTCT10247 — the prefix
--   is a constant in code (Referee Tool, Connecticut), not stored, so a
--   Massachusetts club is RTMA without touching a row.
--
--   Digits only after the prefix. No R/C for rec/comp, no T for tournament,
--   no club code, no year. An identifier's one job is to never change, and
--   game_type gets edited (it was wiped once and restored from a screenshot).
--   Comp/rec is already purple everywhere; it sits BESIDE the number.
--
--   DEFAULT nextval means every future insert — club submission, CA import,
--   tournament import, seed — numbers itself. No code has to remember.
--
-- BACKFILL
--   Existing rows are numbered in date order (then id), so the oldest game
--   is 10001 and this weekend's are the highest. Tournament games are
--   numbered after all club games so the two blocks don't interleave —
--   nobody cares, but it reads cleaner in a log.
-- ============================================================================

-- backup (rule: always)
CREATE TABLE IF NOT EXISTS games_backup_20260919            AS SELECT * FROM games;
CREATE TABLE IF NOT EXISTS tournament_games_backup_20260919 AS SELECT * FROM tournament_games;

-- 1. the sequence
CREATE SEQUENCE IF NOT EXISTS game_no_seq START WITH 10001 INCREMENT BY 1;

-- 2. the column on both tables — unique per table, and unique across both
--    by construction (one sequence)
ALTER TABLE games            ADD COLUMN IF NOT EXISTS game_no integer;
ALTER TABLE tournament_games ADD COLUMN IF NOT EXISTS game_no integer;

-- 3. backfill: club games first, in date order; then tournament games
WITH ordered AS (
    SELECT id, row_number() OVER (ORDER BY date NULLS LAST, time NULLS LAST, id) AS rn
    FROM   games WHERE game_no IS NULL
)
UPDATE games g SET game_no = 10000 + o.rn FROM ordered o WHERE o.id = g.id;

SELECT setval('game_no_seq', (SELECT coalesce(max(game_no), 10000) FROM games));

WITH ordered AS (
    SELECT id, row_number() OVER (ORDER BY date NULLS LAST, time NULLS LAST, id) AS rn
    FROM   tournament_games WHERE game_no IS NULL
)
UPDATE tournament_games t
SET    game_no = (SELECT last_value FROM game_no_seq) + o.rn
FROM   ordered o WHERE o.id = t.id;

SELECT setval('game_no_seq', greatest(
    (SELECT coalesce(max(game_no), 10000) FROM games),
    (SELECT coalesce(max(game_no), 10000) FROM tournament_games)));

-- 4. from here on every insert numbers itself
ALTER TABLE games            ALTER COLUMN game_no SET DEFAULT nextval('game_no_seq'),
                             ALTER COLUMN game_no SET NOT NULL;
ALTER TABLE tournament_games ALTER COLUMN game_no SET DEFAULT nextval('game_no_seq'),
                             ALTER COLUMN game_no SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS games_game_no_idx            ON games (game_no);
CREATE UNIQUE INDEX IF NOT EXISTS tournament_games_game_no_idx ON tournament_games (game_no);

COMMENT ON COLUMN games.game_no IS
    'The game number a referee says on the phone. Rendered RTCT<n>. Shared sequence with tournament_games — unique across both. Never changes, never reused.';
COMMENT ON COLUMN tournament_games.game_no IS
    'Same sequence as games.game_no. Rendered RTCT<n>.';

-- 5. lookup: "which game is 10247" without knowing which table.
--    Used by the Find-game box on the admin portal and the workstation.
CREATE OR REPLACE FUNCTION find_game_no(n integer)
RETURNS TABLE (kind text, id bigint, game_no integer, date date, "time" time, home text, away text, club text)
LANGUAGE sql STABLE AS $$
    SELECT 'game', id, game_no, date, time, "Home Team", "Away Team", "Source Club" FROM games            WHERE game_no = n
    UNION ALL
    SELECT 'tournament', id, game_no, date, time, "Home Team", "Away Team", "Source Club" FROM tournament_games WHERE game_no = n
$$;
GRANT EXECUTE ON FUNCTION find_game_no(integer) TO anon, authenticated;


-- VERIFY
SELECT 'games' AS t, count(*), min(game_no), max(game_no), count(DISTINCT game_no) AS distinct_no FROM games
UNION ALL
SELECT 'tournament_games', count(*), min(game_no), max(game_no), count(DISTINCT game_no) FROM tournament_games;
--  expected: games 413 rows 10001..10413, distinct 413
--            tournament_games 1148 rows 10414..11561, distinct 1148

SELECT last_value FROM game_no_seq;
--  expected: 11561 — the next submitted game is RTCT11562

SELECT count(*) FROM games g JOIN tournament_games t ON t.game_no = g.game_no;
--  expected: 0

SELECT * FROM find_game_no(10001);
--  expected: the oldest club game


-- ROLLBACK
-- DROP FUNCTION IF EXISTS find_game_no(integer);
-- ALTER TABLE games DROP COLUMN IF EXISTS game_no;
-- ALTER TABLE tournament_games DROP COLUMN IF EXISTS game_no;
-- DROP SEQUENCE IF EXISTS game_no_seq;
