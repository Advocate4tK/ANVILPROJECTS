-- ============================================================================
-- games.is_scrimmage — mark a game as a scrimmage
-- 2026-09-09
--
-- WHY: Tod, 2026-09-09 — "there are requests coming in for NECONN for actual
--      scrimmages where refs get assigned and paid", and "some are comp and
--      some are rec".
--
-- ⚠️ WHY THIS IS A FLAG AND NOT A THIRD game_type VALUE.
--    A scrimmage is not a kind of soccer, it is a kind of fixture. NECONN plays
--    both comp and rec scrimmages. Making 'Scrimmage' a game_type would erase
--    which one it is, and everything downstream resolves off game_type:
--
--      * crew_rules — a comp scrimmage would fall through to the REC rule and
--        lose its ARs. That is precisely the bug fixed hours earlier today.
--      * pay_rates — comp reads the band (U9-U10), rec reads the exact age
--        (U10). A type of 'Scrimmage' matches neither and the fee falls through
--        to DEFAULTS, which is how East Haddam's U12 quietly exported at 40/25
--        against a real 50/35.
--
--    So: game_type keeps saying Comp or Rec, and is_scrimmage says whether it
--    counts for the standings. The two are orthogonal and must stay that way.
--
-- WHAT IT DOES NOT CHANGE: crew and pay. Referees are assigned and paid for
--    these exactly as they are for a league game of the same type. This column
--    is a LABEL until someone deliberately gives it behaviour.
--
-- ⚠️ STILL OPEN — Central Assign. Every game currently exports. Whether a
--    scrimmage belongs in CA is unanswered as of this migration: if it is not a
--    valid league fixture, resolveLeague() still has to put something in the
--    league column. Nothing in this migration decides that. Ask before wiring
--    any export behaviour to this flag.
-- ============================================================================

ALTER TABLE games
    ADD COLUMN IF NOT EXISTS is_scrimmage boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN games.is_scrimmage IS
    'Friendly/scrimmage rather than a league fixture. Orthogonal to game_type: '
    'a scrimmage is still Comp or Rec, and crews and pays as that type.';


-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------

SELECT column_name, data_type, is_nullable, column_default
FROM   information_schema.columns
WHERE  table_name = 'games' AND column_name = 'is_scrimmage';
--  expected:  is_scrimmage | boolean | NO | false

SELECT count(*) FILTER (WHERE is_scrimmage) AS scrimmages,
       count(*)                             AS total_games
FROM   games;
--  expected: 0 scrimmages out of every existing row — nothing is reclassified.


-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- ALTER TABLE games DROP COLUMN IF EXISTS is_scrimmage;
