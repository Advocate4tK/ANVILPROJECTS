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
-- STEP 2 — run this ONLY AFTER the 25 games have been moved to 2026-11-14.
-- Move them in the portal as usual; this just stamps where they came from,
-- because the workstation did not know how to record it until today.
-- Ids are from BACKUPS/sept26-storm-games-PRE-RESCHEDULE.csv.
-- ============================================================================

-- UPDATE games
-- SET    rescheduled_from = DATE '2026-09-26'
-- WHERE  id IN (3022,3035,                                        -- Canterbury
--               3043,3044,3057,3058,3076,3077,3078,                -- Plainfield
--               3104,3105,3106,3107,3108,3140,3141,3142,3158,
--               3173,3174,3175,3176,3177,3178,3231)                -- NECONN
--   AND  date = DATE '2026-11-14';
--  expected: UPDATE 25.  If it reports fewer, some games have not been moved
--  yet — the AND on the new date is there on purpose so this cannot stamp a
--  game that is still sitting on Saturday.


-- ROLLBACK
-- ALTER TABLE games DROP COLUMN IF EXISTS rescheduled_from;
