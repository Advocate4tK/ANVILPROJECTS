-- ============================================================================
-- Addison Park — field names must match Central Assign exactly  (v2)
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- 2026-09-05: an upload of Eric's games came back 4 imported, 3 errors —
--   "Field '4' not found at venue 'Addison Park'."
-- Our records call them 1..5. CA calls them "Field #1".."Field #5".
--
-- ⚠️ v1 of this script joined on venues.name and matched NOTHING — that table
-- carries BOTH `name` and "Venue Name" and a given row may only have one of
-- them. Keyed on CA's venue id now, which is unambiguous:
--   venue 123 = Addison Park, Glastonbury
--   Field #1 = 68  Field #2 = 69  Field #3 = 70  Field #4 = 71  Field #5 = 72
-- The CA field ids were already correct from the August harvest; only the names
-- were wrong, and the name is what the export writes into the file.
--
-- ⚠️ PER-VENUE, NOT A GLOBAL RULE. NECONN imported 14/14 the day before with
-- fields written as bare 1, 2 and 3, because Old Killingly HS's fields really
-- ARE named that in CA. Do not apply "Field #N" anywhere else.
--
-- ── Look first ──────────────────────────────────────────────────────────────
select f.id, f.name, f."Field Name", f."Field ID",
       v.name as venue_name, v."Venue Name" as venue_name_legacy, v."Venue ID" as ca_venue
  from public.fields f
  join public.venues v on v.id = f.venue_id
 where v."Venue ID" = 123
 order by f."Field ID";

-- ── Rename by CA FIELD ID, the one value already known to be right ──────────
update public.fields f
   set name         = 'Field #' || (f."Field ID" - 67),
       "Field Name" = 'Field #' || (f."Field ID" - 67)
  from public.venues v
 where v.id = f.venue_id
   and v."Venue ID" = 123
   and f."Field ID" between 68 and 72;

-- ── Verify: five rows reading Field #1 .. Field #5 ─────────────────────────
select f.id, f.name, f."Field Name", f."Field ID"
  from public.fields f
  join public.venues v on v.id = f.venue_id
 where v."Venue ID" = 123
 order by f."Field ID";
