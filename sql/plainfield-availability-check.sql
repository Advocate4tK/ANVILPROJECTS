-- ============================================================================
-- Why is nobody showing as available for Plainfield?
-- 2026-10-27 — READ ONLY. Nothing here changes a thing.
--
-- Tod: "I've added Plainfield as me, as the assignor, and I've sent out emails
-- via Central Assign for referees. Can you check to see if anybody's submitted
-- for availability for Plainfield yet? And I'm not seeing them?"
--
-- ⭐ THE FIRST SUSPECT IS THE FORM, NOT THE REFEREES. referee-availability-form
-- builds its club list with:
--     .eq('enabled', true).eq('avail_form_enabled', true)
-- so a club missing EITHER flag never appears as an option. A referee who got
-- the Central Assign email, opened the form and could not find Plainfield in
-- the list did not fail to submit — they were never offered it.
--
-- Run the whole file: SQL Editor > Execute script (Alt+X).
-- ============================================================================

-- 1 ── IS THE FORM EVEN OFFERING PLAINFIELD? ---------------------------------
-- Both flags must be true. If avail_form_enabled is false or null, that is the
-- answer and nothing below will show anything.
-- ⚠️ SELECT * on purpose. Naming columns here cost a run already — clubs has
-- no start_date/end_date, which I assumed it did. The whole row cannot be wrong.
SELECT *
FROM   public.clubs
WHERE  lower(name) LIKE '%plainfield%'
   OR  lower(coalesce("Club Name", '')) LIKE '%plainfield%';


-- 2 ── WHAT SHAPE IS THE AVAILABILITY TABLE? ---------------------------------
-- ⚠️ Printed rather than assumed. Guessing column names on this project has
-- cost real time — "Name" is name, "Venue" is "Venue ID".
SELECT column_name, data_type
FROM   information_schema.columns
WHERE  table_name = 'availability'
ORDER  BY ordinal_position;


-- 3 ── HAS ANYBODY SUBMITTED ANYTHING AT ALL, LATELY? ------------------------
-- The last 20 submissions across every club. If Plainfield is absent but other
-- clubs are landing, the form works and Plainfield is the odd one out.
SELECT *
FROM   public.availability
ORDER  BY id DESC
LIMIT  20;


-- 4 ── ANY ROW THAT MENTIONS PLAINFIELD ANYWHERE ------------------------------
-- ⭐ Casts the whole row to text and searches it, so this works whatever the
-- club column turns out to be called. Crude on purpose: it cannot miss.
SELECT *
FROM   public.availability a
WHERE  lower(a::text) LIKE '%plainfield%'
ORDER  BY a.id DESC;


-- 5 ── AND IS THERE ANYTHING TO BE AVAILABLE FOR? -----------------------------
-- An availability form with no upcoming games to show can look broken when it
-- is only empty.
SELECT "Source Club", count(*) AS games, min(date) AS first_game, max(date) AS last_game
FROM   public.games
WHERE  date >= current_date
  AND  coalesce("Game Status", '') <> 'Cancelled'
GROUP  BY "Source Club"
ORDER  BY games DESC;
