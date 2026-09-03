-- ca_clubs step 6 - the club columns on tournament_games
-- Run with SQL Editor > Execute script (Alt+X), not Ctrl+Enter.
-- ---------------------------------------------------------------------------
-- Tournament games live in their own table and are edited through the same
-- workstation panel, which now writes home_club / away_club. Without these two
-- columns that save throws for any tournament game.
--
-- Same shape as the ones on `games`: additive, nullable, no default. Every
-- tournament game entered before today has no club, and inventing one would be
-- a guess about a real fixture.

alter table public.tournament_games add column if not exists home_club text;
alter table public.tournament_games add column if not exists away_club text;

comment on column public.tournament_games.home_club is
    'Central Assign Home Club - must match ca_clubs.name exactly. NULL on games entered before 2026-09-03.';
comment on column public.tournament_games.away_club is
    'Central Assign Visiting Club - must match ca_clubs.name exactly. NULL on games entered before 2026-09-03.';

-- Check:  select id, "Home Team", home_club, "Away Team", away_club
--         from public.tournament_games order by id desc limit 5;
