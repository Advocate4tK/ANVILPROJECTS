-- ============================================================================
-- Plainfield venues that Central Assign has and we do not  (2026-09-07)
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- CA's Venue Directory, searched "Plainfield", read 2026-09-07:
--   1180  Plainfield Central MS                 Plainfield       no fields
--   1043  Plainfield High School                Plainfield       no fields
--    999  Plainfield Youth Football Complex     Central Village  no fields
--    951  Shepard Hill Elementary School        Plainfield       no fields   (we have this one)
--
-- Ross's Week 1 sheet has a U15 Coed at "Plainfield CentralMS" and I reported
-- that the venue did not exist. It does — in CA. It was missing from OUR table,
-- which is a different sentence and the one I should have said.
--
-- ⚠️ BOTH name columns are set. venues carries `name` AND "Venue Name", and
-- Manship Park sat with an EMPTY `name` for years — every script matching on
-- v.name silently missed it, which cost four rounds of fixes on 2026-09-05.
-- Writing one and not the other is how that happens.
--
-- ⚠️ No fields are added. CA lists none for any of these, and a field name we
-- invent would be rejected on import the way Addison Park's were.
-- ============================================================================

insert into public.venues ("Venue Name", name, "Venue ID", city, state, club_name)
select v.vname, v.vname, v.caid, v.city, 'CT', 'Plainfield Youth Soccer'
  from (values
        ('Plainfield Central MS',             1180, 'Plainfield'),
        ('Plainfield High School',            1043, 'Plainfield'),
        ('Plainfield Youth Football Complex',  999, 'Central Village')
       ) as v(vname, caid, city)
 where not exists (
        select 1 from public.venues x where x."Venue ID" = v.caid
   );

-- Plainfield's portal list is CENTRAL ASSIGN ids — see project_club_venues.
-- Existing entries are kept and the new ones appended, de-duplicated.
update public.clubs c
   set venues = (
        select string_agg(distinct x, ',')
          from unnest(
                 string_to_array(coalesce(nullif(trim(c.venues), ''), ''), ',')
                 || array['999','1043','1180']
               ) as x
         where nullif(trim(x), '') is not null
   )
 where c.id = 50;

-- Verify: four Plainfield venues, and the club list resolving to all of them.
select id, coalesce(nullif(name,''), "Venue Name") as venue, "Venue ID", city, club_name
  from public.venues
 where "Venue ID" in (951, 999, 1043, 1180)
 order by "Venue ID";

select id, "Club Name", venues from public.clubs where id = 50;
