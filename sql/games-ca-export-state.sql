-- ============================================================================
-- ca_exported_at — has this GAME been pushed up to Central Assign?
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- Two different questions were collapsed into one before this:
--
--   ca_confirmed_positions  (already exists) — which ASSIGNMENTS has CA got?
--                           Only meaningful once a referee is in a slot.
--   ca_exported_at          (new)           — was the GAME itself ever sent?
--                           True or false the moment the game exists.
--
-- The second had no home at all. The export tool tracked it in localStorage
-- (`ca_export_history`, keyed Date|Home Team|Away Team|Time), so it died with
-- the browser, never reached the workstation, and un-marked itself whenever a
-- team name or kickoff time was corrected. This column replaces that key with
-- the row itself.
--
-- Nullable, no default, nothing depends on it. Safe mid-season.
-- ============================================================================

alter table public.games            add column if not exists ca_exported_at timestamptz;
alter table public.tournament_games add column if not exists ca_exported_at timestamptz;

comment on column public.games.ca_exported_at is
    'When this game was last written into a Central Assign export file. NULL = never sent.';

-- ── Backfill: NECONN Week 1 ────────────────────────────────────────────────
-- These 14 went into CA on 2026-09-04 and came back clean, so the board should
-- start green on them rather than telling Tod to re-send work already done.
update public.games
   set ca_exported_at = timestamptz '2026-09-04 20:00:00-04'
 where "Source Club" ilike 'neconn'
   and "Date" = date '2026-09-12'
   and ca_exported_at is null;

-- ── Backfill: anything else already uploaded ───────────────────────────────
-- East Haddam's four September games went in on 2026-09-03. Confirm the dates
-- before running this one — guessing here would paint games green that never
-- went, which is worse than a red badge on a game that did.
-- update public.games
--    set ca_exported_at = timestamptz '2026-09-03 15:01:00-04'
--  where "Source Club" ilike 'east haddam'
--    and "Date" between date '2026-09-12' and date '2026-09-26'
--    and ca_exported_at is null;

select "Source Club", count(*) filter (where ca_exported_at is not null) as in_ca,
       count(*) filter (where ca_exported_at is null)     as not_sent
  from public.games
 where "Date" >= current_date
 group by "Source Club"
 order by "Source Club";
