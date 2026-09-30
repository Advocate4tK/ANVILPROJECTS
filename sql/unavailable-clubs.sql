-- ============================================================================
-- referees.unavailable_clubs — unavailable WHERE, not just until when
-- 2026-09-29
--
-- Tod: "when it's marked unavailable, I need to be able to choose whether I
-- want to mark it unavailable for just one club or not."
--
-- THE FLAG IS ALL-OR-NOTHING AND MOST REASONS ARE NOT
--   "Death in family" is every club for a weekend. "Too far" is one club
--   forever and says nothing about the others. Jillian Torrey is marked "too
--   far" by Tod and is currently hidden from NECONN, Canterbury, East Haddam
--   and everybody else, including clubs that may be ten minutes from her door.
--
--   Paired with unavailable_until, the flag can now say both halves of a real
--   answer: WHO and FOR HOW LONG.
--
--     until=NULL   clubs=NULL        → not available to anyone, indefinitely
--     until=Sunday clubs=NULL        → away this weekend
--     until=NULL   clubs=["Griswold"]→ never Griswold, fine everywhere else
--     until=Oct 31 clubs=["NECONN"]  → off NECONN for a month
--
-- NULL or empty means EVERY club, which is what every existing row means and
-- what a blanket mark should keep meaning.
--
-- ⚠️ A CLUB-SCOPED MARK MUST NOT HIDE SOMEBODY FROM A CONTEXT THAT DOES NOT
-- KNOW ITS CLUB. Several places ask "is this referee unavailable?" without a
-- club to hand — a roster list, a search. In those, a scoped mark counts as
-- AVAILABLE. Hiding on a guess is what made Tod afraid to use the feature in
-- the first place; a scoped mark should only ever bite where it applies.
--
-- Stored as a JSON array of club names, same shape and same reasoning as
-- clubs.ca_league.
-- ============================================================================

ALTER TABLE referees ADD COLUMN IF NOT EXISTS unavailable_clubs text;

COMMENT ON COLUMN referees.unavailable_clubs IS
    'JSON array of club names this unavailability applies to, e.g. ["Griswold"]. NULL or empty means every club. Works with unavailable_until: the two together say who it applies to and how long it lasts. Where no club is in context, a scoped mark does not hide the referee.';


-- VERIFY — who is marked, and what the mark now says.
SELECT name,
       unavailable_since::date AS marked,
       unavailable_until       AS until,
       unavailable_clubs       AS clubs,
       unavailable_by          AS by_whom,
       unavailable_reason      AS reason
FROM   referees
WHERE  unavailable IS TRUE
ORDER  BY unavailable_since;
--  expected right now: 2 rows (Jillian Torrey, Tod Smith), both clubs empty,
--  both until empty — i.e. everywhere, forever, which is what they have meant
--  all along.


-- ============================================================================
-- OPTIONAL — Jillian's "too far" is the reason this column exists. Run it only
-- if Griswold is genuinely the club she is too far from; if it is a different
-- one, change the name rather than guessing.
-- ============================================================================

-- UPDATE referees
-- SET    unavailable_clubs = '["Griswold"]'
-- WHERE  name ILIKE 'Jillian Torrey';

-- And Eric's test on Tod's own record, which is not an unavailability at all.
-- UPDATE referees
-- SET    unavailable = false, unavailable_reason = NULL, unavailable_since = NULL,
--        unavailable_by = NULL, unavailable_until = NULL, unavailable_clubs = NULL
-- WHERE  name ILIKE 'Tod Smith';


-- ROLLBACK
-- ALTER TABLE referees DROP COLUMN IF EXISTS unavailable_clubs;
