-- ============================================================================
-- Canterbury venue list — add Manship, and flag the missing Sterling Town Hall
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- What the live table actually holds (read 2026-09-05):
--   185  "" / "Manship Park(Canterbury)"          Canterbury Athletic Association  CA 899
--   211  "Shepherd Hill" / "Shepard Hill Elementary School, Plainfield"  Plainfield  CA 951
--   213  "Sterling Community School" / "Sterling Community Center"       Plainfield  CA 941
--
-- ⚠️ Venue 185's `name` column is EMPTY — only "Venue Name" is set. Every script
-- today that matched on v.name found nothing for Manship, which is why
-- clubs.venues came back as 211,213 with Canterbury's own ground missing.
--
-- ⛔ THERE IS NO STERLING TOWN HALL. It was venue 212 in
-- backup-venues-fields-pre-state-fix.json and has since been deleted. Ross's
-- Week 1 sheet has BOTH Plainfield and Canterbury playing there, so it has to be
-- recreated before those games can be uploaded — with its Central Assign venue
-- id, which we do not currently hold. Not guessed at here.
-- ============================================================================

-- Canterbury's own venue, missing from the club-portal list.
update public.clubs c
   set venues = (
        select string_agg(distinct x, ',')
          from unnest(
                 string_to_array(coalesce(nullif(trim(c.venues), ''), ''), ',') || array['185']
               ) as x
         where nullif(trim(x), '') is not null
   )
 where c.id = 55;

-- And in the workstation's table, matched on the CA id rather than a name column
-- that may be blank.
insert into public.club_venues (club_id, venue_id, source)
select 55, v.id, 'manual'
  from public.venues v
 where v."Venue ID" in (899, 941, 951)
on conflict (club_id, venue_id) do nothing;

-- Verify.
select id, "Club Name", venues from public.clubs where id = 55;

select v.id, coalesce(nullif(v.name,''), v."Venue Name") as venue, v.club_name, v."Venue ID"
  from public.club_venues cv
  join public.venues v on v.id = cv.venue_id
 where cv.club_id = 55
 order by v.id;
