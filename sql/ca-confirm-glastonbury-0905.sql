-- ============================================================================
-- Glastonbury — confirm the 7 games Central Assign holds (2026-09-05)
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- CA's row-by-row result, 8:22 AM:
--   rows 2, 5, 7  OK          <- the Addison Park games, fixed by the field rename
--   rows 1, 3, 4, 6  Duplicate (#404362, #404363, #404364, #404365)
--
-- Duplicate is a CONFIRMATION, not a failure: it means CA already holds the
-- game and declined to create a second one. Both statuses mean the same thing
-- for our purposes, so all seven are green.
--
-- Only needed because the "All imported" button threw on a missing function.
-- Once that fix is live the button does this itself.
--
-- Targets the last export batch rather than a date range, so it can only touch
-- games that were actually in that file.
-- ============================================================================

update public.games
   set ca_imported_at = coalesce(ca_imported_at, now())
 where ca_export_batch is not null
   and ca_imported_at is null
   and "Source Club" ilike 'glastonbury'
   and ca_exported_at >= timestamptz '2026-09-05 00:00:00-04';

-- Verify: Glastonbury should now be clear, and the totals should read
-- East Haddam 10 / Griswold 3 / RHAMYS 2 until the East Haddam backfill runs.
select "Source Club",
       count(*) filter (where ca_imported_at is not null)                           as in_ca,
       count(*) filter (where ca_imported_at is null and ca_exported_at is not null) as sent_unconfirmed,
       count(*) filter (where ca_imported_at is null and ca_exported_at is null)     as never_sent
  from public.games
 where games.date >= current_date
 group by "Source Club"
 order by "Source Club";
