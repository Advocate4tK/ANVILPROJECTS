-- ca_clubs step 4 of 5 - what OUR data calls the same club
-- Split out of ca-clubs.sql so each piece can be run and checked on its own.
-- Run with SQL Editor > Execute script (Alt+X), not Ctrl+Enter.
-- Step 1 (create table public.ca_clubs) was run 2026-09-03 11:49.
-- ---------------------------------------------------------------------------

-- Expect: 18 rows updated.
-- WARNING: 'Valley' is an ASSUMPTION - CA also has 'Valley FC'. Delete that
-- one line if East Haddam's opponent is not Valley Regional.

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

-- Check:  select name, aliases from public.ca_clubs where aliases <> '{}' order by name;
