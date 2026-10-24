-- ============================================================================
-- club_venues — let a signed-in admin change which venues a club claims
-- 2026-10-24
--
-- club-venues-01-table.sql gave this table ONE policy, select, and said why:
-- "Writes stay out of the portal: this is set by the assignor, in SQL or by the
-- backfill script, not by a club submitting a game."
--
-- That was right while nothing but a script ever wrote to it. It is not right
-- now. Promoting a questionnaire is the sanctioned way a club's venue list
-- changes — Tod reviews what they asked for and presses the button — and with
-- select as the only policy the insert is refused and the section simply will
-- not promote.
--
-- ⭐ WHAT IS BEING ALLOWED, EXACTLY. A row here is a LINK: "this club plays at
-- this venue". Adding or removing one never touches venues or fields. Tod,
-- 2026-10-24: "it's not actually removing a venue from our system, it's just
-- removing it from their pool of wanting to use it."
--
-- ⛔ anon STAYS READ-ONLY. The public pages — schedules, openings, the pay
-- portal — read this table under the anon key and must never be able to write
-- to it. Only `authenticated` gains writes, which is a signed-in session.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================

-- Unchanged, restated so this file is the whole picture rather than half of it.
DROP POLICY IF EXISTS club_venues_public_select ON public.club_venues;
CREATE POLICY club_venues_public_select
    ON public.club_venues FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS club_venues_auth_write ON public.club_venues;
CREATE POLICY club_venues_auth_write
    ON public.club_venues FOR ALL
    TO authenticated
    USING (true) WITH CHECK (true);

-- ⚠️ GRANTS ARE REQUIRED FROM 2026-10-30. Supabase stops auto-granting Data API
-- access to new public tables on that date. club_venues predates it, so these
-- change nothing today — they are here so a schema rebuild after the 30th does
-- not quietly lose the ability to promote a venue list.
GRANT SELECT                         ON public.club_venues TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_venues TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_venues TO service_role;


-- VERIFY ---------------------------------------------------------------------

-- Expect two rows: a SELECT policy for {anon,authenticated} and an ALL policy
-- for {authenticated}. If club_venues_auth_write is missing, promoting venues
-- will fail with no error a human would recognise.
SELECT policyname, cmd, roles
FROM   pg_policies
WHERE  tablename = 'club_venues'
ORDER  BY policyname;

-- ⚠️ There is no id column — the key is (club_id, venue_id). Worth seeing, since
-- assuming an id is exactly what broke the promotion in the first place.
SELECT column_name, data_type
FROM   information_schema.columns
WHERE  table_name = 'club_venues'
ORDER  BY ordinal_position;

-- How many venues each club currently claims, busiest first.
SELECT c.name, count(*) AS venues
FROM   public.club_venues cv
JOIN   public.clubs c ON c.id = cv.club_id
GROUP  BY c.name
ORDER  BY venues DESC, c.name;


-- ROLLBACK -------------------------------------------------------------------
-- DROP POLICY IF EXISTS club_venues_auth_write ON public.club_venues;
