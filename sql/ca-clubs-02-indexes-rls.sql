-- ca_clubs step 2 of 5 - indexes and row level security
-- Split out of ca-clubs.sql so each piece can be run and checked on its own.
-- Run with SQL Editor > Execute script (Alt+X), not Ctrl+Enter.
-- Step 1 (create table public.ca_clubs) was run 2026-09-03 11:49.
-- ---------------------------------------------------------------------------

-- Nothing depends on these to work, they make it correct and fast:
--   * one row per CA club regardless of case
--   * alias lookup on every upload row hits an index, not a scan
--   * read-only to the portal; writes happen here, in SQL, when CA changes
-- Policy name is table-prefixed on purpose - a generic "anon_select" would
-- collide with other tables' policies.

create unique index if not exists ca_clubs_name_lower_key
    on public.ca_clubs (lower(name));

-- Alias resolution runs on every upload row, so the array gets a GIN index
-- rather than a sequential scan per row.
create index if not exists ca_clubs_aliases_gin
    on public.ca_clubs using gin (aliases);

alter table public.ca_clubs enable row level security;

-- Policy names are table-prefixed on purpose. Generic names like "anon_select"
-- collide across tables and silently break a working policy elsewhere.
drop policy if exists ca_clubs_public_select on public.ca_clubs;
create policy ca_clubs_public_select
    on public.ca_clubs for select
    to anon, authenticated
    using (true);

-- Check:  select policyname from pg_policies where tablename = 'ca_clubs';
