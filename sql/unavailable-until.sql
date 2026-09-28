-- ============================================================================
-- referees.unavailable_until — when does this stop being true?
-- 2026-09-28
--
-- Tod: "now I'm legitimately scared to mark a players as unavailable.... if the
-- system flags the player eternally. it hsould only be for that day or week or
-- whatever is marked."
--
-- THE FLAG HAD A BEGINNING AND NO END
--   unavailable / unavailable_since / unavailable_by / unavailable_reason
--   record who hid a referee, when, and why. Nothing records until when, so the
--   mark outlives the thing it described and the only way back is remembering.
--
--   Three people are hidden right now and they are three different kinds of
--   thing wearing one flag:
--     Jolie Clavette   12 days   "Death in Family"   one weekend, long past
--     Jillian Torrey   11 days   "too far"           permanent, correctly sticky
--     Tod Smith         6 days   "test"              Eric's test, never undone
--
--   The cost is not the stale rows. It is that the feature becomes frightening:
--   a tool you avoid because you cannot see the way out is worse than no tool.
--
-- NULL means indefinite, which is what "too far" wants and what every existing
-- row keeps. A date means the mark simply stops applying that morning — nobody
-- has to remember, and nothing has to run.
--
-- ⚠️ EVERY READER MUST ASK BOTH. A pane that checks `unavailable` alone will
-- keep hiding somebody the rest of the tool considers available, which is the
-- same two-panes-disagreeing shape that has bitten this codebase all weekend.
-- assignor-workstation.html routes every read through isUnavailableNow().
-- ============================================================================

ALTER TABLE referees ADD COLUMN IF NOT EXISTS unavailable_until date;

COMMENT ON COLUMN referees.unavailable_until IS
    'Last date this unavailability applies, inclusive. NULL = indefinite, for a permanent reason like distance. A referee counts as unavailable only while unavailable = true AND (unavailable_until IS NULL OR unavailable_until >= today), so a temporary mark expires on its own.';


-- VERIFY — who is hidden, and how long they have been.
SELECT name,
       unavailable_since::date  AS marked,
       unavailable_until        AS until,
       (CURRENT_DATE - unavailable_since::date) AS days_so_far,
       unavailable_by           AS by_whom,
       unavailable_reason       AS reason
FROM   referees
WHERE  unavailable IS TRUE
ORDER  BY unavailable_since;
--  expected right now: 3 rows, every `until` empty.


-- ============================================================================
-- OPTIONAL — the two that are plainly finished. Jillian stays: "too far" is a
-- standing fact, not an event. Run these only if you agree.
-- ============================================================================

-- Jolie Clavette — a bereavement from 16 Sep, twelve days ago.
-- UPDATE referees
-- SET    unavailable = false, unavailable_until = NULL,
--        unavailable_reason = NULL, unavailable_since = NULL, unavailable_by = NULL
-- WHERE  name ILIKE 'Jolie Clavette';

-- Tod Smith — Eric's test, 6 days ago.
-- UPDATE referees
-- SET    unavailable = false, unavailable_until = NULL,
--        unavailable_reason = NULL, unavailable_since = NULL, unavailable_by = NULL
-- WHERE  name ILIKE 'Tod Smith';


-- ROLLBACK
-- ALTER TABLE referees DROP COLUMN IF EXISTS unavailable_until;
