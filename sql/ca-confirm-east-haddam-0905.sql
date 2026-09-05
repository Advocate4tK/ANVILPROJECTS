-- ============================================================================
-- East Haddam — all 10 upcoming games confirmed in Central Assign (2026-09-05)
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- CA's row-by-row result, 8:34 AM:
--   rows 1-4   Duplicate (#404005, #404006, #404007, #404008) - the 9/3 import
--   rows 5-10  OK
-- Duplicate means CA holds the game and declined to make a second one, so both
-- statuses confirm. All ten are green.
--
-- This REPLACES sql/ca-backfill-east-haddam.sql, which guessed at which four
-- went up on 9/3 by created_at and the September date window. CA named them, and
-- the guess was right — 2961, 2963, 2964, 2965 — but a guess is no longer needed,
-- so the file has been deleted rather than left around to be re-run later.
--
-- Only needed because "All imported" threw before the fix landed.
-- ============================================================================

update public.games
   set ca_exported_at = coalesce(ca_exported_at, timestamptz '2026-09-05 08:30:00-04'),
       ca_imported_at = coalesce(ca_imported_at, now())
 where "Source Club" ilike 'east haddam'
   and games.date >= current_date
   and ca_imported_at is null;

select "Source Club",
       count(*) filter (where ca_imported_at is not null)                           as in_ca,
       count(*) filter (where ca_imported_at is null and ca_exported_at is not null) as sent_unconfirmed,
       count(*) filter (where ca_imported_at is null and ca_exported_at is null)     as never_sent
  from public.games
 where games.date >= current_date
 group by "Source Club"
 order by "Source Club";
