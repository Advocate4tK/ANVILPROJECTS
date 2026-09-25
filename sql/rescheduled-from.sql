-- ============================================================================
-- games.rescheduled_from — the date the game used to be on
-- 2026-09-25
--
-- Tod: "we need the current outward facing schedule to leave the finger print
-- and say 'rescheduled' ... maybe rescheduled to 'xxx date' on the old one with
-- the red watermark saying 'RESCHEDULED' instead of cancelled."
--
-- WHY A COLUMN AND NOT A SECOND ROW
--   Moving a game is already a one-row edit: the portal writes a new date and
--   the game is simply somewhere else. Nothing anywhere remembers where it
--   was — the workstation's reschedule is a toast on screen
--   (assignor-workstation.html, showChangeCompleteModal) and there is no
--   change-history table, only game_incidents. So Saturday goes empty and the
--   families who were driving there see the same thing they'd see after a data
--   error: nothing.
--
--   The alternative was leaving a dead copy behind on the old date. That
--   duplicates the game number, doubles what Central Assign holds, and every
--   count on every page then has to learn to skip it. One date on the row the
--   game already has says the same thing and stays true if it moves twice.
--
-- HOW THE SCHEDULE USES IT
--   schedules/club.js pulls games for the week being viewed AND games whose
--   rescheduled_from lands in that week. The second set renders ghosted on the
--   old date, red RESCHEDULED watermark where CANCELLED goes, "Rescheduled to
--   Saturday, November 14" under the matchup. The game also shows live on its
--   new date. It is deliberately in both places: the old date is answering a
--   question ("what happened to Saturday?"), the new one is a fixture.
--
-- WHAT SET IT OFF
--   A nor'easter, 2026-09-25. NECONN, Plainfield and Canterbury called all of
--   Saturday 26 Sep — 25 games — and moved them to Sat 14 Nov. Griswold and
--   East Haddam were not affected. The 25 rows as they stood are saved at
--   BACKUPS/sept26-storm-games-PRE-RESCHEDULE.csv.
--
-- NULL means the game has always been on the date it says. Never defaulted.
-- ============================================================================

ALTER TABLE games ADD COLUMN IF NOT EXISTS rescheduled_from date;

COMMENT ON COLUMN games.rescheduled_from IS
    'The date this game was originally scheduled for, when it has been moved. Set by the assignor workstation when a change control writes a new date. The public club schedule renders a ghosted RESCHEDULED row on this date pointing at the current one, so a called-off Saturday does not just go blank. NULL = never moved.';

CREATE INDEX IF NOT EXISTS games_rescheduled_from_idx
    ON games (rescheduled_from)
    WHERE rescheduled_from IS NOT NULL;


-- VERIFY — the column is there and nothing claims a footprint yet.
SELECT count(*) AS total_games,
       count(rescheduled_from) AS with_footprint
FROM   games;
--  expected right now: with_footprint = 0


-- ============================================================================
-- STEP 2 — THE MOVE ITSELF. 24 rec games, 26 Sep → 14 Nov.
--
-- Does three things in one pass, because they are one event and must not be
-- able to half-happen: moves the date, records where it moved from, and
-- scrubs the crew. Tod, 2026-09-25: "the assigned refs are scrubbed" — seven
-- weeks out, nobody's availability from September still means anything.
--
-- ⚠️ 24 OF THE 25, NOT ALL OF THEM.
--   Tod: "we should probably ask about the CUP match... I would NOT move that.
--   nor the COMP matches... this was REC games alone I would think."
--   The clubs called off their own rec Saturday. A cup fixture is not theirs to
--   move — the date belongs to the competition.
--
--   id 3231 · RTCT11570 · NECONN · U12 · Gregorzek U12 v Sallam U12 · 10:00
--   CJSA Connecticut Cup, flagged both is_cup and game_type Comp — the only one
--   of the 25 that is either. It stays on 26 Sep until CJSA says otherwise.
--
-- Every row as it stands right now is saved at
-- BACKUPS/sept26-storm-games-PRE-RESCHEDULE.csv — all 25, every column.
--
-- ⚠️ CENTRAL ASSIGN DOES NOT HEAR ABOUT THIS. Its importer adds, it cannot
-- update (sql/ca-change-sync.sql). All 24 are already in CA at the old date and
-- have to be changed there BY HAND. ca_change_synced_at is nulled below so the
-- Changes page keeps asking until somebody has.
-- ============================================================================

BEGIN;

UPDATE games
SET    date             = DATE '2026-11-14',
       rescheduled_from = DATE '2026-09-26',
       "Center Referee" = NULL,
       "AR 1"           = NULL,
       "AR 2"           = NULL,
       ca_change_synced_at = NULL
WHERE  id IN (3022,3035,                                        -- Canterbury
              3043,3044,3057,3058,3076,3077,3078,                -- Plainfield
              3104,3105,3106,3107,3108,3140,3141,3142,3158,
              3173,3174,3175,3176,3177,3178)                     -- NECONN rec
  AND  date = DATE '2026-09-26';
--  expected: UPDATE 24.  Anything else — STOP and ROLLBACK.
--  The AND on the old date makes this safe to run twice: a second run matches
--  nothing rather than moving something a further seven weeks.

-- Look before you commit.
SELECT "Source Club", count(*) AS games,
       count("Center Referee") AS centres_left,
       min(date) AS date
FROM   games
WHERE  rescheduled_from = DATE '2026-09-26'
GROUP  BY "Source Club"
ORDER  BY 1;
--  expected: Canterbury 2, NECONN 15, Plainfield 7 — all 2026-11-14,
--  centres_left 0 everywhere.

COMMIT;
-- ROLLBACK;   ← use this one instead if the numbers are wrong


-- VERIFY — what 26 Sep looks like afterwards. The 24 are gone from that date
-- and reachable only through the footprint; the cup game is still sitting there.
SELECT game_no, "Source Club", time, "Home Team", "Away Team", is_cup, game_type
FROM   games
WHERE  date = DATE '2026-09-26'
ORDER  BY "Source Club", time;
--  expected: 9 rows — Griswold 5, East Haddam 3, and NECONN's RTCT11570.


-- ROLLBACK
-- ALTER TABLE games DROP COLUMN IF EXISTS rescheduled_from;
