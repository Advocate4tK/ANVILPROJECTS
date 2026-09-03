-- club_venues backfill 2 of 2 — the pairs held in clubs.venues
-- DBeaver, SQL Editor > Execute script (Alt+X).
-- ---------------------------------------------------------------------------
-- These ten pairs come from scripts/build-club-venues.mjs, which parses the
-- clubs.venues text field with the quote-aware tokenizer. The script can read
-- but cannot write: club_venues is RLS select-only for anon, deliberately, and
-- the script runs on the anon key. So the parsing happens there and the writing
-- happens here, as postgres.
--
-- Resolved by NAME and CA venue id rather than row ids, so this file says what
-- it means and cannot silently attach the wrong venue if a row id ever moves.
--
-- ⭐ 1149 Rotary Glastonbury is the reason any of this exists: it sat on
-- Glastonbury's list the whole time while three September games were played
-- against it, and no dropdown could see it.

insert into public.club_venues (club_id, venue_id, source)
select c.id, v.id, 'clubs_venues'
from (values
    ('East Haddam',  1128),   -- Municipal Field
    ('glastonbury',  1082),   -- Giddeon Welles          (CA's spelling)
    ('glastonbury',   645),   -- Hebron Avenue School
    ('glastonbury',  1021),   -- Smith Middle School
    ('glastonbury',   923),   -- Magnet School
    ('glastonbury',  1149),   -- Rotary Glastonbury
    ('Griswold',      845),   -- Blackwell Field(Canterbury)
    ('Griswold',      899),   -- Manship Park(Canterbury)
    ('Portland',      421),   -- Lewis Mills High School
    ('Portland',      625)    -- Portland Recreational Complex
) as x(club_name, ca_venue_id)
join public.clubs  c on lower(c.name)  = lower(x.club_name)
join public.venues v on v."Venue ID"   = x.ca_venue_id
on conflict do nothing;

-- Expect: 10 rows.
--
-- NOT included, and why:
--   neconn CA 360  — the wrong Bull Hill Park id, corrected to 560 on 2026-09-02.
--                    The stale number still sits in clubs.venues; fix it there.
--   neconn CA 1100 — matches no venue row at all. Unexplained; leave it until
--                    somebody knows what it was meant to be.
--
-- ⚠️ Worth a human look, not a fix: Griswold's list claims Blackwell Field and
-- Manship Park, both named "(Canterbury)", while Canterbury Athletic Association
-- has no venue list of its own. Might be genuine, might be drift. This table is
-- the first thing that has ever made it visible.

-- Check:  select c.name, count(*) as venues
--         from public.club_venues cv join public.clubs c on c.id = cv.club_id
--         group by c.name order by c.name;
