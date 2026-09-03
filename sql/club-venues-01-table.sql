-- club_venues — which venues belong to which club, as rows instead of a guess
-- Run in DBeaver with SQL Editor > Execute script (Alt+X).
-- ---------------------------------------------------------------------------
-- Today a venue dropdown decides scope from one of two broken sources:
--
--   venues.club_name  — a single text club. 47 of 546 venues have one; 499 are
--                       NULL, so 91% of venues belong to nobody. That is why
--                       Rotary Glastonbury (CA 1149) vanished from the
--                       workstation while three games sat on it.
--   clubs.venues      — a text field mixing floats, bare ints and quoted
--                       thousands separators: 123.0,"1,082.0",567.0,…,1017,923,1149
--                       It has already been misparsed once, collapsing
--                       1017,923,1149 into the id 10179231149 and hiding three
--                       Glastonbury venues while games were entered against them.
--
-- Neither is fixable in place: a venue is used by MORE THAN ONE club, which a
-- single text column cannot say. This table can.
--
-- ⚠️ STAGE 1 OF 2. This creates and fills the table. NOTHING reads it yet, so
-- no dropdown changes and no club loses sight of a venue. Verify the contents
-- first; the code switches over in stage 2.

create table if not exists public.club_venues (
    club_id    bigint      not null references public.clubs (id) on delete cascade,
    venue_id   bigint      not null references public.venues (id) on delete cascade,
    -- Where the row came from, so a bad backfill can be undone without guessing:
    -- 'club_name' | 'clubs_venues' | 'manual'
    source     text        not null default 'manual',
    created_at timestamptz not null default now(),
    primary key (club_id, venue_id)
);

-- The lookup is always "venues for this club", so club_id leads the primary key
-- and covers it. This second index serves the reverse — "who uses this venue" —
-- which is the question to ask before ever deleting or renaming one.
create index if not exists club_venues_venue_id_idx on public.club_venues (venue_id);

alter table public.club_venues enable row level security;

drop policy if exists club_venues_public_select on public.club_venues;
create policy club_venues_public_select
    on public.club_venues for select
    to anon, authenticated
    using (true);

-- Writes stay out of the portal: this is set by the assignor, in SQL or by the
-- backfill script, not by a club submitting a game.

comment on table public.club_venues is
    'Which venues each club plays at. Replaces venues.club_name (single-valued, 91% NULL) and clubs.venues (unparseable text). Built 2026-09-03.';

-- ── Backfill 1 of 2: the 47 venues that name a club ──────────────────────────
insert into public.club_venues (club_id, venue_id, source)
select c.id, v.id, 'club_name'
from public.venues v
join public.clubs  c on lower(c.name) = lower(v.club_name)
where v.club_name is not null and v.club_name <> ''
on conflict do nothing;

-- Backfill 2 of 2 is clubs.venues, which needs the quote-aware tokenizer and so
-- runs from scripts/build-club-venues.mjs — preview first, then --write.

-- Check:  select c.name, count(*) from public.club_venues cv
--         join public.clubs c on c.id = cv.club_id group by c.name order by c.name;
