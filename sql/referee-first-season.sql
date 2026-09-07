-- ============================================================================
-- first_season — the year a referee STARTED, so experience counts itself
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- Tod, 2026-09-07: "system should keep track of them and update... so if last
-- season they were season 1 this season will be season 2. next year they will be
-- year 2."
--
-- ⚠️ THE CURRENT FIELD FREEZES. `Years Reffing` is free text and behaves two
-- different ways:
--     '2024'    -> the display computes live (getFullYear() - n + 1) and rolls
--                  over on its own every season
--     'Seas 1'  -> frozen. It reads Seas 1 for ever, however many seasons pass.
-- Jolie Clavette has been Seas 1 since the day she was entered, and always would
-- have been. It is not a bad row; it is a field that stores the ANSWER instead of
-- the FACT.
--
-- first_season stores the fact. Every display derives from it, so on the first of
-- next September everyone advances without anyone touching anything.
--
-- ⚠️ NOTHING IS UPDATED BY THIS SCRIPT YET. The look-first query is the point:
-- created_at is the only signal we have for when a labelled referee started, and
-- if a batch was imported from Airtable in one go, their created_at is the import
-- date and NOT their first season. Backfilling on that would quietly demote every
-- veteran in the batch. Read the counts before uncommenting anything.
-- ============================================================================

alter table public.referees add column if not exists first_season smallint;

comment on column public.referees.first_season is
    'Calendar year the referee first officiated. Experience is DERIVED from this, never stored as a label.';

-- ── Look first ─────────────────────────────────────────────────────────────
-- What is actually in the field, and when were those rows created?
select coalesce(nullif(trim("Years Reffing"), ''), '(blank)') as years_reffing,
       count(*)                                               as refs,
       min(created_at)::date                                  as earliest_row,
       max(created_at)::date                                  as latest_row
  from public.referees
 group by 1
 order by refs desc;

-- Do the created_at dates cluster on a handful of days? That is the signature of
-- an import, and it means created_at is NOT a start date.
select created_at::date as created_on, count(*)
  from public.referees
 group by 1
 having count(*) > 5
 order by count(*) desc
 limit 10;

-- ── Then, and only then ────────────────────────────────────────────────────
-- Safe on its own: a value that is already a YEAR is a fact, not a guess.
-- update public.referees
--    set first_season = ("Years Reffing")::smallint
--  where first_season is null
--    and "Years Reffing" ~ '^(19|20)[0-9]{2}$';
--
-- Derived from the label. ONLY run this if the counts above show created_at is
-- genuinely when each referee joined:
--   Seas 1 -> started the year the row was created
--   Seas 2 -> the year before that
--   Yr N   -> N years before the current season
-- update public.referees
--    set first_season = case
--          when lower(trim("Years Reffing")) in ('seas 1','season 1')
--               then extract(year from created_at)::smallint
--          when lower(trim("Years Reffing")) in ('seas 2','season 2')
--               then (extract(year from created_at) - 1)::smallint
--          when lower(trim("Years Reffing")) ~ '^yr\s*[0-9]+'
--               then (extract(year from current_date)
--                     - substring(lower(trim("Years Reffing")) from '[0-9]+')::int)::smallint
--        end
--  where first_season is null
--    and "Years Reffing" is not null;

select count(*) filter (where first_season is not null) as have_start,
       count(*) filter (where first_season is null)     as still_unknown
  from public.referees;
