-- ============================================================================
-- Addison Park — field names must match Central Assign exactly
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- 2026-09-05: an upload of Eric's games came back 4 imported, 3 errors —
--   "Field '4' not found at venue 'Addison Park'."
--   "Field '3' not found at venue 'Addison Park'."
-- Our records call them 3 and 4. CA calls them "Field #3" and "Field #4".
--
-- CA's own Venue Directory, read 2026-09-05, and our August harvest agree:
--   venue 123  Addison Park, Glastonbury
--     Field #1 = 68   Field #2 = 69   Field #3 = 70
--     Field #4 = 71   Field #5 = 72
--
-- ⚠️ THIS IS PER-VENUE, NOT A GLOBAL RULE. NECONN imported 14/14 the day before
-- with fields written as bare 1, 2 and 3 — because Old Killingly HS's fields
-- really ARE named that in CA. There is no universal "Field #N" format to apply;
-- each venue is named however CA names it. The durable fix is backfilling CA's
-- names across the whole fields table from scripts/ca-venue-staging, which holds
-- every CA venue and field we harvested in August. This file fixes one venue.
--
-- ── Look first ──────────────────────────────────────────────────────────────
select f.id, f.name, f."Field Name", f."Field ID", v.name as venue
  from public.fields f
  join public.venues v on v.id = f.venue_id
 where v.name ilike '%addison%'
 order by f.name;

-- ── Then rename to CA's spelling and stamp CA's field ids ───────────────────
-- Matched on the digit inside whatever the field is currently called, so "3",
-- "Field 3" and "Field #3" all land on the same row.
with ca (n, ca_id) as (
    values (1, 68), (2, 69), (3, 70), (4, 71), (5, 72)
)
update public.fields f
   set name         = 'Field #' || ca.n,
       "Field Name" = 'Field #' || ca.n,
       "Field ID"   = ca.ca_id
  from ca, public.venues v
 where v.id = f.venue_id
   and v.name ilike '%addison%'
   and (regexp_match(coalesce(f.name, f."Field Name", ''), '(\d+)'))[1]::int = ca.n;

-- ── Verify ──────────────────────────────────────────────────────────────────
select f.id, f.name, f."Field ID", v.name as venue, v."Venue ID" as ca_venue
  from public.fields f
  join public.venues v on v.id = f.venue_id
 where v.name ilike '%addison%'
 order by f.name;
