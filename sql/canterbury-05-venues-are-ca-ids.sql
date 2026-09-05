-- ============================================================================
-- ⚠️ clubs.venues HOLDS CENTRAL ASSIGN VENUE IDs, NOT OUR ROW IDs
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- Proven 2026-09-05. Canterbury's clubs.venues was set to '185,211,213' — our
-- row ids for Manship, Shepherd Hill and Sterling Community Center. The club
-- portal resolved them as CA ids and offered:
--
--   venue row 323  "Broad River"     CA id 185
--   venue row 495  "Founders Field"  CA id 211
--
-- Two venues with no connection to Canterbury, and its own ground missing.
-- Three scripts in a row had no visible effect for this reason.
--
-- The same mistake is recorded in .claude-memory as the old Glastonbury bug:
-- '1017,923,1149' hid three venues. Those are CA ids too — Rotary Glastonbury is
-- CA 1149 — which is why parsing them as row ids found nothing.
--
--   clubs.venues   CA "Venue ID"   read by the CLUB PORTAL
--   club_venues    our venues.id   read by the WORKSTATION
--
-- Both are needed, and they are NOT the same numbers. club_venues was already
-- written with row ids and is correct; only this column was wrong.
-- ============================================================================

update public.clubs
   set venues = '150,899,941,951'   -- Baldwin MS, Manship Park, Sterling Community Center, Shepherd Hill
 where id = 55;

-- Verify: four venues, resolved the way the portal resolves them.
select c.id, c."Club Name", c.venues,
       v.id as row_id, v."Venue ID" as ca_id,
       coalesce(nullif(v.name,''), v."Venue Name") as venue, v.club_name
  from public.clubs c
  left join public.venues v
    on v."Venue ID"::text = any (string_to_array(replace(c.venues, ' ', ''), ','))
 where c.id = 55
 order by v."Venue ID";
