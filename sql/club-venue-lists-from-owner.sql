-- ============================================================================
-- Fill clubs.venues for clubs that have none — from venues.club_name
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- A club with an EMPTY clubs.venues gets every venue in the table in its portal
-- dropdown: club-game-submit.html falls back to `allVenues.slice()` when the
-- list is empty. Plainfield was offering all 546, which is how a club ends up
-- filing a game at a ground three counties away.
--
-- ⚠️ clubs.venues holds CENTRAL ASSIGN venue ids, not our row ids. Proven
-- 2026-09-05 — see project_club_venues memory. A venue with no CA id cannot go
-- in this list at all, and is excluded below rather than written as a null.
--
-- Only fills clubs that are currently EMPTY. Existing lists are hand-curated
-- (a club may legitimately use another club's ground) and are not touched.
-- ============================================================================

-- Look first: who is empty, and what would they get?
select c.id, c."Club Name", coalesce(nullif(trim(c.venues), ''), '(empty)') as current_list,
       (select string_agg(distinct v."Venue ID"::text, ',' order by v."Venue ID"::text)
          from public.venues v
         where v.club_name is not null
           and v."Venue ID" is not null
           and lower(v.club_name) = lower(c."Club Name")) as would_get
  from public.clubs c
 order by c.id;

-- Fill only the empty ones.
update public.clubs c
   set venues = (
        select string_agg(distinct v."Venue ID"::text, ',' order by v."Venue ID"::text)
          from public.venues v
         where v.club_name is not null
           and v."Venue ID" is not null
           and lower(v.club_name) = lower(c."Club Name")
   )
 where coalesce(nullif(trim(c.venues), ''), '') = ''
   and exists (
        select 1 from public.venues v
         where v.club_name is not null
           and v."Venue ID" is not null
           and lower(v.club_name) = lower(c."Club Name")
   );

select id, "Club Name", venues from public.clubs order by id;
