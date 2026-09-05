-- ============================================================================
-- East Haddam — the four games Central Assign took on 2026-09-03
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- The first clean import after CA changed its format on 7/31: 4 imported, 0
-- errors, 3:01 PM. The run before it sent CA's venue ID (867) and was rejected
-- on every row; switching to the venue NAME is what made it work.
--
-- ⚠️ IDENTIFIED BY INFERENCE, NOT BY RECORD. The export tracked itself in
-- localStorage back then, so nothing queryable says which rows went. These four
-- are the only games that fit every constraint:
--   · created 2026-09-01 07:34, before the 09-03 export (the other three East
--     Haddam rows were created 09-04, the day AFTER)
--   · dated in September (the file was "four September games")
--   · one U10 and three U12 — matching the two fee tiers in the file,
--     40/30 and 50/35, and half lengths 20 and 35
-- If Tod's browser still holds ca_export_history from that day it would confirm
-- it outright. Short of that, this is the honest best reading.
--
-- ca_exported_at is set as well as ca_imported_at: they really were exported,
-- and leaving it null would make the amber count wrong later.
-- ============================================================================

update public.games
   set ca_exported_at  = coalesce(ca_exported_at,  timestamptz '2026-09-03 15:01:00-04'),
       ca_imported_at  = coalesce(ca_imported_at,  timestamptz '2026-09-03 15:01:00-04'),
       ca_export_batch = coalesce(ca_export_batch, 'backfill-easthaddam-0903')
 where id in (2961, 2963, 2964, 2965);

-- Verify: these four green, East Haddam's other six still outstanding.
select id, games.date, games.time, "Away Team", "Age Group",
       ca_imported_at is not null as in_ca
  from public.games
 where "Source Club" ilike 'east haddam'
   and games.date >= current_date
 order by games.date, games.time;
