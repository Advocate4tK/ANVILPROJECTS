-- ============================================================================
-- first_season — second pass, for the 22 the derivation could not reach
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X). Run AFTER the backfill.
--
-- Twelve of these carry a 'Seas 1' / 'Seas 2' label but had NO availability
-- submission to date from, so pass one had nothing to work with. The rest are
-- free text a person typed years ago.
--
-- ⚠️ EVERY VALUE BELOW IS A JUDGEMENT, NOT A DERIVATION. They are written out
-- one referee at a time so they can be argued with, rather than hidden inside a
-- CASE expression. Anything genuinely unknowable is left NULL for Eric.
-- ============================================================================

-- ── 1. Labels with no submission history ───────────────────────────────────
-- They said "Season 1" and the only clock we have is that they were entered in
-- 2026. So Spring 2026 for Seas 1, which makes them Seas 2 this autumn — exactly
-- the correction Eric is asking for. Seas 2 backs up one season.
update public.referees
   set first_season = '2026-1'
 where first_season is null
   and lower(trim("Years Reffing")) in ('seas 1','season 1');

update public.referees
   set first_season = '2025-2'
 where first_season is null
   and lower(trim("Years Reffing")) in ('seas 2','season 2');

-- ── 2. Readable free text ──────────────────────────────────────────────────
update public.referees set first_season = '2024-1'
 where first_season is null and "Years Reffing" = '2024-2025';           -- started 2024

update public.referees set first_season = '1997-1'
 where first_season is null and "Years Reffing" = '97 I think';          -- Eric Forrest

update public.referees set first_season = '2023-1'
 where first_season is null and "Years Reffing" = '45139';               -- Excel serial ~Aug 2023

update public.referees set first_season = '2025-1'
 where first_season is null and "Years Reffing" = 'Year 2';              -- Yr 2 now -> started 2025

update public.referees set first_season = '2026-1'
 where first_season is null and "Years Reffing" in ('0','1');            -- brand new

-- ── 3. Left deliberately NULL — a guess here would be a lie ───────────────
--   Ellie Gaul        '2-3 years ago'   2023 or 2024, and it matters
--   Paul Yanosy       '1990''s'         anywhere in a decade
--   Rehan Banglawala  'N/A'
-- Ask them. Until then they show no experience rather than a wrong one.

-- ── 4. What is left ────────────────────────────────────────────────────────
select name, "Years Reffing" as old_value, first_season
  from public.referees
 where coalesce(nullif(trim("Years Reffing"), ''), '') <> ''
   and first_season is null
 order by name;

select count(*) filter (where first_season is not null) as derived,
       count(*) filter (where first_season is null
                        and coalesce(nullif(trim("Years Reffing"),''),'') <> '') as still_unknown,
       count(*) filter (where coalesce(nullif(trim("Years Reffing"),''),'') = '') as never_answered
  from public.referees;
