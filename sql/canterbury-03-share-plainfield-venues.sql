-- ============================================================================
-- Canterbury may use Plainfield's venues  (2026-09-05)
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- Tod: "Plainfield is sharing Sterling Town Hall with Canterbury but Canterbury
-- is supplying the referees... let's just make them all available."
--
-- Ross's Week 1 sheet had Canterbury hosting Putnam at Sterling Town Hall and it
-- was read as an error. It was not: the clubs share grounds and the home club
-- supplies the officials.
--
-- ⚠️ TWO PLACES, because two pages ask different tables:
--   club_venues    the workstation reads this
--   clubs.venues   the CLUB PORTAL still reads this legacy text column
-- Writing only one leaves the venue visible in the workstation and missing from
-- the form clubs actually submit games on.
--
-- ⚠️ NOTHING IS RENAMED. The "(Plainfield)" tag in the dropdown is added in the
-- page at render time. The stored venue name is what goes into the Central
-- Assign file and CA matches on exact name — "Sterling Town Hall (Plainfield)"
-- in the record would fail every import, the way "Old KHS" did this morning.
-- ============================================================================

-- 1. Workstation scope.
insert into public.club_venues (club_id, venue_id, source)
select c.id, v.id, 'manual'
  from public.clubs c
  cross join public.venues v
 where c.id = 55                                   -- canterbury-athletic-association
   and v.club_name ilike '%plainfield%'
on conflict (club_id, venue_id) do nothing;

-- 2. Club portal scope. clubs.venues is a comma-joined id list; Canterbury's
--    existing ids are kept and Plainfield's appended, de-duplicated.
with shared as (
    select string_agg(distinct v.id::text, ',' order by v.id::text) as ids
      from public.venues v
     where v.club_name ilike '%plainfield%'
)
update public.clubs c
   set venues = (
        select string_agg(distinct x, ',')
          from unnest(
                 string_to_array(coalesce(nullif(trim(c.venues), ''), ''), ',')
                 || string_to_array((select ids from shared), ',')
               ) as x
         where nullif(trim(x), '') is not null
   )
 where c.id = 55;

-- Verify: Canterbury should now list Manship plus every Plainfield venue.
select v.id, v.name, v."Venue Name", v.club_name
  from public.club_venues cv
  join public.venues v on v.id = cv.venue_id
 where cv.club_id = 55
 order by v.id;

select id, "Club Name", venues from public.clubs where id = 55;
