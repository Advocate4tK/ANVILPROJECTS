-- ============================================================================
-- Canterbury — minimal club row so Week 1 games have somewhere to go
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- ⚠️ THIS IS A HALF-BUILT CLUB, ON PURPOSE. Tod chose it 2026-09-04 to get two
-- games in tonight instead of running the wizard. It has a name, a CA mapping,
-- an upload URL and one venue. It does NOT have pay rates, billing, contacts or
-- age groups, so Entity Status will show it incomplete and that is CORRECT —
-- see project_wizard_drafts.md, which is the decision this deliberately bends.
-- Finish it in manage-clubs when David Puckett sends rates.
--
-- Safe to re-run: the insert is guarded on the name, the venue link on its PK.
-- ============================================================================

insert into public.clubs ("Club Name", name, "Source Club", "Club Game Upload", ca_club_id, enabled)
select 'Canterbury',
       'Canterbury',
       'Canterbury',
       'https://referee-tool.com/club-game-submit.html?club=canterbury',
       (select id from public.ca_clubs where name = 'Cantebury Soccer Club'),
       true
where not exists (select 1 from public.clubs where "Club Name" ilike 'canterbury');

-- Manship Park is already in venues (CA ID 899). It is also Griswold's, which
-- is exactly why club_venues exists — a venue can belong to more than one club.
insert into public.club_venues (club_id, venue_id, source)
select c.id, v.id, 'manual'
from public.clubs c
cross join public.venues v
where c."Club Name" ilike 'canterbury'
  and (v."Venue ID" = 899 or v.name ilike '%manship%')
on conflict (club_id, venue_id) do nothing;

-- Verify: expect one club row with a ca_club_id, and at least one venue link.
select c.id, c."Club Name", c."Club Game Upload", c.ca_club_id, c.enabled,
       (select count(*) from public.club_venues cv where cv.club_id = c.id) as venue_links
from public.clubs c
where c."Club Name" ilike 'canterbury';
