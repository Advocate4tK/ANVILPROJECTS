-- ============================================================================
-- Canterbury + Plainfield — make two EXISTING clubs visible
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- Neither club needs creating. Both rows already exist:
--   id 55  canterbury-athletic-association   ca_club_id 17, NO upload URL
--   id 50  plainfield-youth-soccer           has upload URL
--
-- Two different pages, two different gates, which is why each club was missing
-- from a different place:
--   assignor-upload.html  lists a club only if "Club Game Upload" is set
--   avail-form-settings   lists a club only if enabled = true
-- ============================================================================

-- 1. Canterbury has no upload URL, so it never appears in Game Upload.
--    The slug must match the club's `name`, which is what club-game-submit
--    resolves ?club= against — same pattern as Plainfield's.
update public.clubs
   set "Club Game Upload" = 'https://referee-tool.com/club-game-submit.html?club=canterbury-athletic-association'
 where id = 55
   and coalesce("Club Game Upload", '') = '';

-- 2. Both live, so they show on the availability form and Entity Status.
update public.clubs set enabled = true where id in (50, 55) and coalesce(enabled, false) = false;

-- 3. Manship Park (CA 899) is Canterbury's home venue. It is also Griswold's —
--    a venue belongs to more than one club, which is what club_venues is for.
insert into public.club_venues (club_id, venue_id, source)
select 55, v.id, 'manual'
  from public.venues v
 where v."Venue ID" = 899 or v.name ilike '%manship%'
on conflict (club_id, venue_id) do nothing;

-- Verify: both rows live, Canterbury holding a URL and at least one venue.
select c.id, c.name, c."Club Name", c."Club Game Upload", c.ca_club_id, c.enabled,
       (select count(*) from public.club_venues cv where cv.club_id = c.id) as venue_links
  from public.clubs c
 where c.id in (50, 55)
 order by c.id;
