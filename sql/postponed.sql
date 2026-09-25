-- ============================================================================
-- games.postponed_at — off, and nobody knows when yet
-- 2026-09-25
--
-- Star Ems, East Haddam, 10:13 AM, the morning of the nor'easter:
--   "All games for east haddam are being rescheduled for a different weekend.
--    There were three games on Saturday and one on Sunday. Do you recommend
--    cancelling in the tool or modifying the dates and times as I get the
--    rescheduling information?"
--
-- WHY SHE HAD TO ASK
--   The club portal offers two things and she needed a third. Cancel says the
--   game is not being played — it is, just later. A change request demands a
--   date and a time, hard-validated (club-game-submit.html), and she does not
--   have one yet. Her only options were to cancel a game that was not cancelled
--   or invent a date. She emailed instead, which was the right call.
--
-- WHAT THIS IS
--   The waiting room between the two. The game keeps its date, its number, its
--   place in Central Assign, and reads POSTPONED · NEW DATE TO COME on the
--   public schedule — greyed and struck through like a moved game, because the
--   practical fact for a family is identical: do not drive there Saturday.
--
--   When the date arrives it is an ordinary reschedule. The workstation writes
--   the new date, stamps rescheduled_from, and the row flips itself to
--   RESCHEDULED → <date>. Clearing postponed_at is part of that same edit.
--
-- ⚠️ A POSTPONEMENT IS NOT A CANCELLATION.
--   It scratches nobody and it zeroes no fee. Only no_show and late_scratch do
--   that — see the pay slot semantics. A postponed game has not happened yet;
--   a cancelled one is not happening. Nothing in the pay path may read this
--   column as if it were cancellation_type.
--
-- NULL means the game is on. Never defaulted.
-- ============================================================================

ALTER TABLE games ADD COLUMN IF NOT EXISTS postponed_at timestamptz;

COMMENT ON COLUMN games.postponed_at IS
    'When this game was postponed with no new date yet known. The game keeps its date and its number; the public club schedule shows POSTPONED, new date to come. Cleared when a real date is set, at which point rescheduled_from takes over and the old date reads RESCHEDULED. NOT a cancellation: it scratches nobody and zeroes no fee.';

CREATE INDEX IF NOT EXISTS games_postponed_idx
    ON games (postponed_at)
    WHERE postponed_at IS NOT NULL;


-- VERIFY — the column is there and nothing is postponed yet.
SELECT count(*) AS total_games,
       count(postponed_at) AS postponed
FROM   games;
--  expected right now: postponed = 0


-- ============================================================================
-- STEP 2 — East Haddam's weekend. Three Saturday, one Sunday.
-- Crews come off: a date nobody knows yet cannot hold one, and Tod has already
-- told the referees. The games stay exactly where they are until Star has a
-- weekend from Valley Regional, Waterford and Ledyard.
-- ============================================================================

BEGIN;

UPDATE games
SET    postponed_at     = now(),
       "Center Referee" = NULL,
       "AR 1"           = NULL,
       "AR 2"           = NULL,
       ca_change_synced_at = NULL
WHERE  game_no IN (10239, 10247, 10256, 10264)
  AND  postponed_at IS NULL;
--  expected: UPDATE 4.  Anything else — STOP and ROLLBACK.
--    10239  Sat 26 Sep  09:30  U12 Silver  v Valley Regional
--    10247  Sat 26 Sep  11:30  U12 Bronze  v Waterford
--    10256  Sat 26 Sep  13:30  U10 Bronze  v Team C
--    10264  Sun 27 Sep  15:00  U12 Bronze  v Ledyard Team C

-- Look before you commit.
SELECT game_no, date, time, "Home Team", "Away Team",
       "Center Referee", postponed_at
FROM   games
WHERE  postponed_at IS NOT NULL
ORDER  BY date, time;
--  expected: the four above, dates unchanged, Center Referee empty.

COMMIT;
-- ROLLBACK;   ← use this one instead if the numbers are wrong


-- ROLLBACK
-- ALTER TABLE games DROP COLUMN IF EXISTS postponed_at;
