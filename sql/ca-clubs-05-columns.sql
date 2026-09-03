-- ca_clubs step 5 of 5 - the club columns on games and clubs
-- Split out of ca-clubs.sql so each piece can be run and checked on its own.
-- Run with SQL Editor > Execute script (Alt+X), not Ctrl+Enter.
-- Step 1 (create table public.ca_clubs) was run 2026-09-03 11:49.
-- ---------------------------------------------------------------------------

-- Additive and nullable. Games entered before today have no club, and a
-- default would be a guess about real history.

alter table public.games add column if not exists home_club text;
alter table public.games add column if not exists away_club text;

comment on column public.games.home_club is
    'Central Assign Home Club — must match ca_clubs.name exactly. NULL on games entered before 2026-09-03.';
comment on column public.games.away_club is
    'Central Assign Visiting Club — must match ca_clubs.name exactly. NULL on games entered before 2026-09-03.';

-- ── clubs -> ca_clubs ────────────────────────────────────────────────────────
alter table public.clubs add column if not exists ca_club_id bigint
    references public.ca_clubs (id);

create index if not exists clubs_ca_club_id_idx on public.clubs (ca_club_id);

-- Point our clubs at their CA row. This is what the club portal reads to
-- lock Home Club to the page's own club.
update public.clubs c set ca_club_id = a.id
from public.ca_clubs a
where c.ca_club_id is null
  and (lower(c.name) = lower(a.name)
       or lower(c.name) = any (select lower(x) from unnest(a.aliases) x));

-- Check:  select name, ca_club_id from public.clubs order by name;
--         anything NULL there cannot submit or export games.
