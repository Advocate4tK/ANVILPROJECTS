-- ============================================================================
-- VENUE UNIFICATION — PHASE 0: BACKUP + DIAGNOSTICS  (2026-06-23)
-- ============================================================================
-- Goal of the whole project: ONE neutral `venues` table that clubs, events, and
-- tournaments all reference through a junction table `entity_venues`, instead of
-- the current 3 patterns (clubs=venues.club_name string, events/tournaments=JSONB).
--
-- THIS FILE IS 100% SAFE: it only CREATES backup tables and RUNS SELECTs.
-- It changes ZERO live rows. Run it in the Supabase SQL editor, then paste the
-- output of the DIAGNOSTICS section back to Ralph so the real migration is
-- written against your actual data, not assumptions.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART A — BACKUPS (timestamped snapshots; restore source if anything goes wrong)
-- ----------------------------------------------------------------------------
create table if not exists _bak_venues_20260623      as select * from venues;
create table if not exists _bak_fields_20260623      as select * from fields;
create table if not exists _bak_clubs_20260623       as select * from clubs;
create table if not exists _bak_events_20260623      as select id, name, venues from events;
create table if not exists _bak_tournaments_20260623 as select id, name, venues from tournaments;

-- confirm the backups exist with row counts
select '_bak_venues'      as backup, count(*) from _bak_venues_20260623
union all select '_bak_fields',      count(*) from _bak_fields_20260623
union all select '_bak_clubs',       count(*) from _bak_clubs_20260623
union all select '_bak_events',      count(*) from _bak_events_20260623
union all select '_bak_tournaments', count(*) from _bak_tournaments_20260623;

-- ----------------------------------------------------------------------------
-- PART B — DIAGNOSTICS (read-only; paste ALL of this output back to Ralph)
-- ----------------------------------------------------------------------------

-- B1. venues table — columns, count, sample
select count(*) as venue_count from venues;
select * from venues order by id limit 8;

-- B2. club associations today: which club_name values exist + how many venues each
select coalesce(club_name,'(null)') as club_name, count(*) as venues
from venues group by club_name order by 2 desc;

-- B3. EVENTS — how venues are stored in the JSONB (shape + a real sample)
select id, name,
       jsonb_typeof(venues) as venues_type,
       case when jsonb_typeof(venues)='array' then jsonb_array_length(venues) else null end as n_venues,
       venues
from events
where venues is not null
limit 8;

-- B4. TOURNAMENTS — same JSONB inspection
select id, name,
       jsonb_typeof(venues) as venues_type,
       case when jsonb_typeof(venues)='array' then jsonb_array_length(venues) else null end as n_venues,
       venues
from tournaments
where venues is not null
limit 8;

-- B5. fields table — how fields hang off venues (the chain we must preserve)
select count(*) as field_count from fields;
select * from fields order by id limit 8;

-- B6. Does a single venue ever serve >1 club today? (the case the new model unlocks)
--     If 0 rows, current data is 1:1; the junction still future-proofs it.
select "Venue Name", count(distinct club_name) as clubs
from venues
where club_name is not null
group by "Venue Name"
having count(distinct club_name) > 1;
