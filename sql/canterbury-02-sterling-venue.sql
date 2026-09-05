-- ============================================================================
-- Canterbury plays at Sterling Town Hall — Plainfield's venue
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- Tod, 2026-09-04: "bottom line is Canterbury needs to use Plainfields Venue."
-- Ross's Week 1 sheet has Canterbury hosting Putnam (U12 Boys, 10:30 AM) at
-- Sterling Town Hall, and Central Assign accepts it.
--
-- This is exactly the case club_venues was built for. The old model — a single
-- venues.club_name — could not say that one field belongs to two clubs, so a
-- shared venue had to be stolen from one to give to the other. Nothing is taken
-- from Plainfield here; Canterbury is added alongside it.
-- ============================================================================

insert into public.club_venues (club_id, venue_id, source)
select 55, v.id, 'manual'
  from public.venues v
 where v.name ilike 'sterling town hall'
on conflict (club_id, venue_id) do nothing;

-- Verify: Sterling Town Hall should now list BOTH clubs.
select v.id as venue_id, v.name as venue, c.id as club_id, c."Club Name"
  from public.club_venues cv
  join public.venues v on v.id = cv.venue_id
  join public.clubs  c on c.id = cv.club_id
 where v.name ilike 'sterling town hall'
 order by c.id;
