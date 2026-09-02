-- Bull Hill Park — correct the CA venue id, then load its fields.
--
--   RTVCT019 · venues.id 217 · North Grosvenordale · NECONN
--
-- We store CA Venue ID 360. The CA venue directory shows Bull Hill Park,
-- No. Grosvenordale as CA 560 with Field #1 #811, Field #2 #812, Field #3
-- #813. Looks like a 3-for-5 slip when it was first entered.
--
-- Ruled out a genuine second venue: the neighbouring CA entries are Buck Hill
-- Park (76, Waterbury), Bunker Hill Park (561, Waterbury) and Burnt Hill Park
-- (577, Hebron). There is no other Bull Hill Park in the directory.
--
-- Checked before writing: no fields and no games key to CA 360, and no other
-- venue holds 560. That is a safety check, NOT the justification — the
-- justification is the CA directory. Absence of references proves nothing on
-- venues that never went live.
--
-- ⚠️ REQUIRES sql/bentley_fields.sql step 2 to have run first — that is what
-- installs trg_fields_rt_code, which mints each row its own RTFCT###.
--
-- ⚠️ One statement at a time (Ctrl+Enter). No begin/commit wrapper: one here
-- previously reported success while rolling everything back.

-- ---------- 1. correct the CA venue id ----------
update venues set "Venue ID" = 560 where id = 217 and "Venue ID" = 360;

-- ---------- 2. the three fields ----------
insert into fields (venue_id, "Venue ID", "Field ID", "Field Name", state) values
  (217, 560, 811, 'Field #1', 'CT'),
  (217, 560, 812, 'Field #2', 'CT'),
  (217, 560, 813, 'Field #3', 'CT');

-- ---------- 3. verify — expect the venue on 560 and 3 fields with codes ----------
select v.id, v.rt_code, v."Venue Name", v."Venue ID" as ca_venue,
       f.rt_code as field_code, f."Field Name", f."Field ID" as ca_field
  from venues v
  left join fields f on f.venue_id = v.id
 where v.id = 217
 order by f."Field Name";
