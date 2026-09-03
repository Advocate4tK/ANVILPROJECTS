-- ca_clubs step 7 - Haddam-Killingworth is "HK Soccer Club" in Central Assign
-- Run with SQL Editor > Execute script (Alt+X), not Ctrl+Enter.
-- ---------------------------------------------------------------------------
-- Eric confirmed by email 2026-09-03 with a screenshot of CA's Home Club
-- dropdown. CA abbreviates it, so it sorts between "Hartford Soccer Club
-- (includes Hartford Hellions)" and "JA Elite FC" - exactly the stretch the
-- dropdown capture skipped, which is why it looked absent.
--
-- Nothing about the club was wrong; our transcription had a hole. Worth
-- remembering before declaring anything else missing from CA: the seed is
-- partial by construction.

insert into public.ca_clubs (name, aliases) values
    ('HK Soccer Club', array['Haddam-Killingworth', 'Haddam Killingworth', 'HK'])
on conflict (lower(name)) do update set aliases = excluded.aliases;

update public.clubs c set ca_club_id = a.id
from public.ca_clubs a
where a.name = 'HK Soccer Club'
  and lower(c.name) = 'haddam-killingworth';

-- Check:  select name, ca_club_id from public.clubs where ca_club_id is null order by name;
--         should now leave only kova-soccer-club and RECREATION, both correct.
