-- ============================================================================
-- Cup Match — a flag on top of Comp, not a third game type
-- 2026-09-22
--
-- Tod: "we also have a different KIND of comp game called 'cup match' in CT.
-- ... yes it is comp but its a serious upgrade of COMP."
--
-- WHY A FLAG AND NOT game_type = 'Cup'
--   crew_rules.game_type is CHECK (… IN ('Comp','Rec')) and its rows are keyed
--   U10|Comp / U10|Rec. pay_rates splits the same way. A game whose game_type
--   read 'Cup' would match NO crew rule (so the openings board would stop
--   knowing whether it takes ARs) and NO pay rate (so the pay portal would
--   show nothing). That is the U10-AR bug and the Lebanon pay wipe again, in
--   one move.
--
--   So game_type stays 'Comp' — every existing lookup keeps working, untouched
--   — and is_cup rides on top, exactly like is_scrimmage. Only the things that
--   should care (the gold 🏆 on schedules, the filter, the openings card)
--   read it.
--
-- PAY AND CREW
--   A cup match pays and crews as Comp until Tod says otherwise. When he does,
--   the flag is already there to hang it on.
--
-- THE ONE THAT PROMPTED THIS
--   RTCT11570 — Gregorzek U12 vs Sallam U12, Sat Sep 26 10:00 AM, Route 101
--   Field. Uploaded by Ross Sward 2026-09-22 with the note "This is a CT Cup
--   match and was confirmed late last night." Three empty slots, four days out.
--   It is flagged at the bottom of this script.
-- ============================================================================

ALTER TABLE games            ADD COLUMN IF NOT EXISTS is_cup boolean NOT NULL DEFAULT false;
ALTER TABLE tournament_games ADD COLUMN IF NOT EXISTS is_cup boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN games.is_cup IS
    'Cup Match — a competitive fixture of higher stakes than a league comp game. game_type stays ''Comp'' so crew rules and pay lookups are unaffected; this flag only drives display (gold 🏆), filtering and search.';
COMMENT ON COLUMN tournament_games.is_cup IS
    'Cup Match. Same meaning as games.is_cup.';

CREATE INDEX IF NOT EXISTS games_is_cup_idx ON games (is_cup) WHERE is_cup;

-- Ross's game, flagged.
UPDATE games SET is_cup = true WHERE game_no = 11570;


-- VERIFY
SELECT game_no, date, "Home Team", "Away Team", game_type, is_cup
FROM   games WHERE is_cup ORDER BY date;
--  expected: 11570 | 2026-09-26 | Gregorzek U12 | Sallam U12 | Comp | true

SELECT count(*) FILTER (WHERE is_cup) AS cup,
       count(*) FILTER (WHERE game_type = 'Comp') AS comp,
       count(*) FILTER (WHERE game_type = 'Rec')  AS rec
FROM   games;
--  expected: cup 1, comp 161, rec 261 — the cup game is STILL counted as comp


-- ROLLBACK
-- ALTER TABLE games DROP COLUMN IF EXISTS is_cup;
-- ALTER TABLE tournament_games DROP COLUMN IF EXISTS is_cup;
