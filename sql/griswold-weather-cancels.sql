-- ============================================================================
-- Ed Conn's three — weather cancellations, Sat 26 Sep 2026
-- 2026-09-25
--
-- Tod: "Ed's cancels are cancels."
--
-- Filed through the club portal across the nor'easter morning, one at a time,
-- because the form could only ask about one game at a time:
--    RTCT11563  10:00  Griswold U10 Girls v Lebanon U10 G    filed  9:43 AM
--    RTCT11565  12:40  U10 Boys Team 1 v U10 Boys Team 2     filed 10:53 AM
--    RTCT11564  11:30  Griswold U10 Girls v U10 Girls        filed 11:46 AM
-- All three are Harrison Durand's. He keeps the 2:00 PM U12 if Ed plays it.
--
-- WHY SQL AND NOT THE WORKSTATION
--   The Cancel button could not save these all day — it sent 'Notes', a column
--   that does not exist (the column is lowercase notes), PostgREST rejected the
--   whole update, and because supabase-js resolves rather than throws on a
--   rejected write, nothing ever said so. Both are fixed and pushed. Neither
--   fix has been confirmed in a real browser yet, and these games are tomorrow
--   morning, so this does not wait on that.
--
-- WHAT IT WRITES — exactly what confirmCancelGame() writes, nothing more:
--   Game Status      'Cancelled'      · the public schedule stamps it CANCELLED
--   cancellation_type 'weather'       · ⚠️ weather pays nothing, any notice
--   cancelled_at      now()
--   notes            [RESOLVED – ts] stamp, so the changes page stops counting
--                    them and does not sort them as epoch zero
--
-- ⛔ REFEREES ARE NOT CLEARED. Deliberate, and it matches the workstation:
--    a cancelled game keeps its crew on the record so the pay run and the
--    history still know who was assigned. Only a MOVE scrubs a crew.
--
-- ⚠️ Central Assign still holds all three live. Its importer cannot update,
--    only add, so they have to be cancelled there BY HAND.
--    ca_change_synced_at is nulled so the Changes page keeps asking.
-- ============================================================================

BEGIN;

UPDATE games
SET    "Game Status"      = 'Cancelled',
       cancellation_type  = 'weather',
       cancelled_at       = now(),
       notes              = coalesce(notes, '')
                            || E'\n[RESOLVED – ' || to_char(now() AT TIME ZONE 'America/New_York',
                                                            'Mon DD, YYYY, HH12:MI AM')
                            || '] Cancelled (weather)',
       ca_change_synced_at = NULL
WHERE  game_no IN (11563, 11564, 11565)
  AND  "Game Status" = 'Change Requested';
--  expected: UPDATE 3.  Anything else — STOP and ROLLBACK.
--  Guarded on the current status, so running it twice changes nothing.

-- Look before you commit.
SELECT game_no, date, time, "Home Team", "Away Team",
       "Game Status", cancellation_type, "Center Referee",
       right(notes, 60) AS note_tail
FROM   games
WHERE  game_no IN (11563, 11564, 11565)
ORDER  BY time;
--  expected: three rows, Cancelled / weather, Harrison Durand still on each,
--  every note ending in "Cancelled (weather)".

COMMIT;
-- ROLLBACK;   ← use this one instead if the numbers are wrong


-- AFTERWARDS
--   Griswold's public schedule stamps all three CANCELLED, the open change
--   request count drops from 3 to 0, and Saturday leaves the U15 at 1:00 that
--   Ed wants to play and the U12 at 2:00 he has not ruled on.
