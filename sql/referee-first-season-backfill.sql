-- ============================================================================
-- first_season backfill — derive the START from what each row already says
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
-- Requires sql/referee-first-season.sql (adds the column) to have run first.
--
-- Format: 'YYYY-S', S = 1 Spring (Mar-Aug), 2 Fall (Sep-Feb). Matches
-- js/ref-experience.js exactly — that file is the only thing that reads it.
--
-- ⚠️ created_at IS NOT A START DATE. Checked 2026-09-07: every row sits between
-- 2026-03-25 and 2026-09-07, and every year-valued row is stamped 2026-04-07 —
-- the Airtable import. Using it would say every veteran started this spring.
-- The earliest AVAILABILITY SUBMISSION is used instead: a referee cannot have
-- offered to work before they existed, so it is a true upper bound on their
-- start, and for the "Seas 1" group it is almost exactly right.
--
-- What the field actually holds (2,565 rows, counted before writing this):
--     blank                 2333   left alone — nothing to derive from
--     'Seas 1' / 'Seas 2'     79   the frozen labels Eric is complaining about
--     a YEAR   '2024'        ~100  a fact; taken at face value, Spring assumed
--     a COUNT  '2' '3' '30'   ~75  years of experience AS OF WHEN IT WAS TYPED
--     junk                    ~10  '1990''s', '97 I think', 'N/A', '45139'
--
-- ⚠️ The COUNT group is the one to be careful with. '3' meant three years on the
-- day it was entered, so the start is (that year - 3 + 1). Read as a start year
-- instead it would make a fifteen-year veteran a rookie.
-- ============================================================================

-- ── 1. Look first ──────────────────────────────────────────────────────────
with first_avail as (
    select lower(trim(a."Referee Name")) as nm, min(a.date) as first_date
      from public.availability a
     where a."Referee Name" is not null and a.date is not null
     group by 1
)
select r."Years Reffing", count(*) as refs,
       count(fa.first_date) as have_a_submission,
       min(fa.first_date)   as earliest,
       max(fa.first_date)   as latest
  from public.referees r
  left join first_avail fa
    on fa.nm = lower(trim(r.name))
 where coalesce(nullif(trim(r."Years Reffing"), ''), '') <> ''
 group by 1
 order by refs desc;

-- ── 2. A stored YEAR is a fact. Spring assumed; it only ever differs by one
--       season and never changes the Yr number in practice.
update public.referees
   set first_season = "Years Reffing" || '-1'
 where first_season is null
   and "Years Reffing" ~ '^(19|20)[0-9]{2}$'
   and ("Years Reffing")::int between 1970 and extract(year from current_date)::int;

-- ── 3. A COUNT of years, as of the day it was typed. created_at is a poor
--       clock but it is the only one these rows have, and they were all typed
--       into this system in 2026 — so (2026 - n + 1).
update public.referees
   set first_season = (extract(year from created_at)::int
                       - ("Years Reffing")::int + 1)::text || '-1'
 where first_season is null
   and "Years Reffing" ~ '^[0-9]{1,2}$'
   and ("Years Reffing")::int between 2 and 60;

-- ── 4. The frozen labels. Their earliest availability submission is when they
--       said it, so that season IS Seas 1 for them; a 'Seas 2' referee had
--       already done one season by then, so back up one.
with first_avail as (
    select lower(trim(a."Referee Name")) as nm, min(a.date) as first_date
      from public.availability a
     where a."Referee Name" is not null and a.date is not null
     group by 1
),
derived as (
    select r.id,
           -- the season containing their first submission
           case when extract(month from fa.first_date) between 3 and 8
                then extract(year from fa.first_date)::int * 2
                when extract(month from fa.first_date) >= 9
                then extract(year from fa.first_date)::int * 2 + 1
                else (extract(year from fa.first_date)::int - 1) * 2 + 1
           end as ord,
           lower(trim(r."Years Reffing")) as lbl
      from public.referees r
      join first_avail fa on fa.nm = lower(trim(r.name))
     where r.first_season is null
       and lower(trim(r."Years Reffing")) in ('seas 1','season 1','seas 2','season 2')
)
update public.referees r
   set first_season = ( (d.ord - case when d.lbl like '%2' then 1 else 0 end) / 2 )::text
                    || '-' || ( ((d.ord - case when d.lbl like '%2' then 1 else 0 end) % 2) + 1 )::text
  from derived d
 where r.id = d.id;

-- ── 5. What is left, and what everyone now reads as ────────────────────────
select first_season, count(*) as refs
  from public.referees
 where first_season is not null
 group by 1 order by 1;

select r.name, r."Years Reffing" as old_label, r.first_season
  from public.referees r
 where coalesce(nullif(trim(r."Years Reffing"), ''), '') <> ''
   and r.first_season is null
 order by r.name;
