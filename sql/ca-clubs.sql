-- ============================================================================
-- ca_clubs — a MIRROR of Central Assign's Home Club / Visiting Club dropdown
-- ============================================================================
-- CA's Add Game form makes Home Club and Visiting Club REQUIRED dropdowns while
-- Home Team and Visiting Team are free text. So the club is constrained to CA's
-- own list and the team is not: a club name that is not CA's exact string maps
-- to nothing and the row is rejected.
--
-- What that costs us in practice, read off CA's list on 2026-09-03:
--   our "Canterbury Athletic Association"  ->  CA "Cantebury Soccer Club" (no r)
--   our "glastonbury"                      ->  CA "Glastonbury Hartwell Soccer Club"
--   our "Stonington Soccer Club"           ->  CA "Stonington SC"
-- CA also holds its own typos ("Tournment", "Lyme-Old lyme Soccer Club"). They
-- are copied VERBATIM. Tidying a name here means the game does not import.
--
-- This is a mirror, not an extension of `clubs`. Our clubs table holds 16 rows
-- including kova-soccer-club and RECREATION, which will never exist in CA, and
-- CA holds hundreds we never touch. clubs.ca_club_id is the join.
--
-- WARNING: THE SEED BELOW IS PARTIAL — 140 of CA's names, transcribed from
-- Ralph Eyes captures of the dropdown on 2026-09-03. Known gaps: the whole I
-- section, and anything after "Woodbury Bethlehem Youth Soccer". Every club we
-- currently export is present. Add the rest as it is captured; an absent name
-- is a rejected upload, never a silently wrong one.
--
-- Run in DBeaver. Safe to re-run: creates are IF NOT EXISTS, seed is ON CONFLICT.
-- ============================================================================

create table if not exists public.ca_clubs (
    id          bigint generated always as identity primary key,
    name        text        not null,
    aliases     text[]      not null default '{}',
    -- CA's generic landing spots. Legal values in the dropdown, but never the
    -- automatic answer for an unmatched club: "Other" is a decision, not a
    -- default, so nothing resolves to a fallback without a person choosing it.
    is_fallback boolean     not null default false,
    created_at  timestamptz not null default now()
);

-- Case-insensitive identity. Two rows differing only in case would be the same
-- CA club, and the whole point of the table is one row per CA club.
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

-- Writes are deliberately NOT granted to anon. This list changes when CA
-- changes, which means a human capture and a run of this file — not a club
-- portal insert.

-- ── games: the club, alongside the team ──────────────────────────────────────
-- "Home Team" / "Away Team" keep holding what they hold (the team text a club
-- typed). These two carry CA's club string, which is what the export needs.
-- Nullable because every game entered before today has no club recorded, and a
-- not-null default would be a guess about real history.
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

-- ── Seed: CA's dropdown, verbatim ────────────────────────────────────────────
insert into public.ca_clubs (name) values
    ('A.C. Connecticut'),
    ('Ajax'),
    ('Ansonia Soccer Club'),
    ('Avon Soccer Club'),
    ('Beachside Soccer Club'),
    ('Berlin Youth Soccer Association'),
    ('Bethel Youth Soccer Association'),
    ('Bloomfield Junior Soccer Association'),
    ('Bolton Soccer'),
    ('Branford Soccer Club'),
    ('Bridgeport Hawks'),
    ('Bridgeport Scorpions FC'),
    ('Bristol Soccer Club'),
    ('Brookfield Soccer Club'),
    ('Burlington Junior Soccer Association'),
    ('Cantebury Soccer Club'),
    ('Canton Youth Soccer Association'),
    ('CFC Ole Football Club'),
    ('CFC South'),
    ('Chelsea Piers Shoreline SC'),
    ('Cheshire Soccer Club'),
    ('Clinton Invitational Tournament'),
    ('Clinton Youth Soccer Association'),
    ('Coginchaug Soccer Club'),
    ('Colchester Youth Soccer'),
    ('Columbia Windham Soccer Alliance'),
    ('Connecticut FC'),
    ('Connecticut Shamrocks'),
    ('Coventry Soccer'),
    ('Cromwell Chill Soccer Club'),
    ('CT Impact United Soccer Academy'),
    ('Darien Soccer Association'),
    ('Derby Youth Soccer'),
    ('DOCA Futbol Academy'),
    ('East Granby Soccer Association'),
    ('East Haddam Soccer Club'),
    ('East Hampton Soccer Club'),
    ('East Hartford Soccer Club'),
    ('East Haven Youth Soccer'),
    ('East Lyme Soccer Association'),
    ('Easton Redding United Soccer'),
    ('East Windsor Soccer Club'),
    ('EC Soccer'),
    ('Ellington Parks and Recreation'),
    ('Enfield Soccer Association'),
    ('Fairfield United Soccer Association'),
    ('Farmington Soccer Club'),
    ('FC North'),
    ('Foundation Sports Club'),
    ('FSA Farmington Sports Arena FC'),
    ('Ginga FC'),
    ('Glastonbury Hartwell Soccer Club'),
    ('Granby Rovers Soccer Club'),
    ('Green Warriors Soccer Academy'),
    ('Greenwich Soccer Association'),
    ('Griswold Soccer Club'),
    ('Groton Soccer Club'),
    ('GZS United'),
    ('Hamden Soccer Association'),
    ('Hartford Athletic'),
    ('Hartford Lions Soccer Academy'),
    ('Hartford Premier and Developmental'),
    ('Hartford Soccer Club (includes Hartford Hellions)'),
    ('JA Elite FC'),
    ('JCFC'),
    ('Lebanon Soccer Club'),
    ('Ledyard Soccer Club'),
    ('Litchfield Soccer Club'),
    ('Lyme-Old lyme Soccer Club'),
    ('Madison Invitational Tournament'),
    ('Madison Youth Soccer'),
    ('Manchester Soccer Club'),
    ('Meriden Soccer Club'),
    ('Middletown Youth Soccer'),
    ('Milford United Soccer Club'),
    ('Monroe Soccer Club'),
    ('Montville Youth Soccer Club'),
    ('Naugatuck Youth Soccer'),
    ('NECONN Soccer Club'),
    ('New Britain Youth Soccer'),
    ('New Canaan FC'),
    ('New Fairfield Soccer Club'),
    ('New Haven Youth Soccer'),
    ('New London Soccer Club'),
    ('Newtown Soccer Club'),
    ('North Branford Soccer Club'),
    ('Northeast United Soccer Club'),
    ('North Haven Soccer Club'),
    ('Northwest United Soccer Club'),
    ('Norwalk Community Soccer Club'),
    ('Norwalk Junior Soccer'),
    ('Norwich Police Athletic League'),
    ('Norwich Youth Soccer Club'),
    ('Oakwood Soccer Club'),
    ('Old Greenwich Riverside CC'),
    ('Old Saybrook Soccer Club'),
    ('Orange Soccer Association and Amity Soccer Club and Woodbridge'),
    ('Oxford Soccer League'),
    ('Plainfield Soccer Club'),
    ('Plainville Soccer Club'),
    ('Pomperaug (includes Middlebury & Southbury) Soccer Club'),
    ('Portland Soccer Club'),
    ('Prospect Dynamo Soccer Club'),
    ('PSC Dynamo CT'),
    ('Revolution United FC'),
    ('RHAM Youth Soccer'),
    ('Rocky Hill Soccer Club'),
    ('Rowayton Soccer Club'),
    ('Seymour Soccer Association'),
    ('Shelton Youth Soccer Organization'),
    ('Shepaug Soccer Club'),
    ('Simmons Soccer Club'),
    ('Simsbury Soccer Club'),
    ('Soccer Club of Guilford'),
    ('Soccer Club of Newington'),
    ('Soccer Club of New Milford'),
    ('Soccer Club of Ridgefield'),
    ('Somers Soccer Association'),
    ('Southeast Soccer Club'),
    ('Southington Soccer Club'),
    ('South Windsor Soccer Club'),
    ('Sporting FC'),
    ('Sterling Advanced Futbol Club'),
    ('Stonington SC'),
    ('Suffield Soccer Club'),
    ('Sylvie Poulin Columbus Day Classic'),
    ('Terryville Youth Soccer Club'),
    ('Thomaston Soccer Club'),
    ('Tolland Soccer Club'),
    ('Torrington Youth Soccer Club'),
    ('Tournment'),
    ('Trumbull United Soccer Club'),
    ('Vale Sports Club'),
    ('Valley FC'),
    ('Valley Regional Soccer Club'),
    ('Vernon Soccer Club'),
    ('Wallingford Youth Soccer'),
    ('WAM United Soccer Club'),
    ('Waterford Soccer Club'),
    ('Watertown Association Youth Soccer'),
    ('Westbrook Soccer Club'),
    ('West Hartford Soccer Club Girls'),
    ('West Hartford YSA Boys'),
    ('West Haven Youth Soccer'),
    ('Weston Soccer Club'),
    ('Westport Soccer Association'),
    ('Wethersfield Soccer Club'),
    ('Wilton Soccer Association'),
    ('Windsor Locks Soccer Club'),
    ('Windsor Soccer Club'),
    ('Winsted Youth Soccer Association'),
    ('Wolcott Youth Athletic Assc.'),
    ('Woodbridge Soccer Club'),
    ('Woodbury Bethlehem Youth Soccer')
on conflict do nothing;

-- CA's generic entries. Flagged so the UI can sort them apart and never
-- auto-resolve to them.
insert into public.ca_clubs (name, is_fallback) values
    ('Other', true),
    ('Referee Services Assignor', true)
on conflict do nothing;

-- ── Aliases: what OUR data calls the same club ───────────────────────────────
-- Sourced from the actual strings in games."Home Team" / games."Away Team" and
-- from clubs.name. Team qualifiers ("- Boys 1", "-Boys B") are stripped in
-- code, so they are not listed here; only genuinely different names are.
--
-- WARNING: 'Valley' is ASSUMED to mean Valley Regional Soccer Club. CA also
-- holds 'Valley FC'. East Haddam's 2026-09-26 opponent is the only row that
-- depends on it. Delete that one alias if the assumption is wrong.
update public.ca_clubs set aliases = v.aliases
from (values
    ('Cantebury Soccer Club',            array['Canterbury Athletic Association','Canterbury']),
    ('Glastonbury Hartwell Soccer Club', array['Glastonbury','glastonbury']),
    ('Stonington SC',                    array['Stonington Soccer Club','Stonington']),
    ('Valley Regional Soccer Club',      array['Valley','Valley Regional']),
    ('NECONN Soccer Club',               array['neconn','NECONN']),
    ('Plainfield Soccer Club',           array['Plainfield Youth Soccer','Plainfield']),
    ('Portland Soccer Club',             array['Portland']),
    ('RHAM Youth Soccer',                array['rhamys','RHAMYS','RHAM']),
    ('Lebanon Soccer Club',              array['lebanon','Lebanon']),
    ('New London Soccer Club',           array['New London']),
    ('WAM United Soccer Club',           array['wam','WAM']),
    ('East Haddam Soccer Club',          array['East Haddam']),
    ('Griswold Soccer Club',             array['Griswold']),
    ('Ledyard Soccer Club',              array['Ledyard']),
    ('Waterford Soccer Club',            array['Waterford']),
    ('Simsbury Soccer Club',             array['Simsbury']),
    ('Rocky Hill Soccer Club',           array['Rocky Hill']),
    ('Coginchaug Soccer Club',           array['Coginchaug'])
) as v(name, aliases)
where public.ca_clubs.name = v.name;

-- DELIBERATELY NOT ALIASED:
--   'Norwich'   — CA has both Norwich Youth Soccer Club and Norwich Police
--                 Athletic League. An ambiguous alias is worse than none; the
--                 upload flags it and a person picks.
--   'Woodstock' — no Woodstock club exists in CA's list at all. Girls Summer
--                 League's "Woodstock A"/"Woodstock B" have nowhere to land.
--   'Haddam-Killingworth' — likewise absent from CA, which lists Hamden then
--                 Hartford with nothing between. Worth confirming before their
--                 games go up.

-- ── Point our clubs at their CA row ──────────────────────────────────────────
update public.clubs c set ca_club_id = a.id
from public.ca_clubs a
where c.ca_club_id is null
  and (lower(c.name) = lower(a.name)
       or lower(c.name) = any (select lower(x) from unnest(a.aliases) x));

-- Verify — our clubs with no CA club are the ones blocked from exporting:
--   select name, ca_club_id from public.clubs where ca_club_id is null order by name;
