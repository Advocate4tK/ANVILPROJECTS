-- ============================================================================
-- referees.city — one spelling per place
-- 2026-09-16
--
-- Tod, reading the blast log by town: "Vernon and VERNON, Somers and somers,
-- Storrs / Storrs Mansfield / storrs mansfield / Storrs, Mansfield." The
-- referee records come from Central Assign, typed by hand, and the same
-- place appears under several spellings. The map copes (it resolves aliases)
-- but every count that groups by city splits when it shouldn't.
--
-- WHAT THIS FIXES: spellings that differ from a canonical CT town ONLY in
--   case or punctuation — "south windsor" → South Windsor, "RockyHill" →
--   Rocky Hill — plus the Storrs family collapsed to "Storrs".
--   78 spellings, 125 rows.
--
-- WHAT THIS LEAVES ALONE, on purpose: villages. West Simsbury, Unionville,
--   Higganum, Mystic, Niantic are real places inside a town, more useful
--   than the town for knowing where a referee lives, and js/ct-regions.js
--   already maps every one of them to its town. Only "Pomfret Center" was
--   missing from that map; it is added alongside this migration.
--
-- ⚠️ BACKUP FIRST. The snapshot table lets any of this be undone.
-- ============================================================================

CREATE TABLE IF NOT EXISTS referees_city_backup_20260916 AS
    SELECT id, city FROM referees;

UPDATE referees r
SET    city = v.to_city
FROM   (VALUES
    ('avon', 'Avon'),  -- 3
    ('AVON', 'Avon'),  -- 2
    ('bethel', 'Bethel'),  -- 1
    ('bolton', 'Bolton'),  -- 1
    ('branford', 'Branford'),  -- 3
    ('bridgeport', 'Bridgeport'),  -- 2
    ('bristol', 'Bristol'),  -- 2
    ('CHESHIRE', 'Cheshire'),  -- 1
    ('colchester', 'Colchester'),  -- 2
    ('coventry', 'Coventry'),  -- 1
    ('danbury', 'Danbury'),  -- 3
    ('DARIEN', 'Darien'),  -- 1
    ('east hartford', 'East Hartford'),  -- 1
    ('East hartford', 'East Hartford'),  -- 1
    ('ellington', 'Ellington'),  -- 1
    ('ENFIELD', 'Enfield'),  -- 2
    ('farmington', 'Farmington'),  -- 1
    ('GLASTONBURY', 'Glastonbury'),  -- 1
    ('guilford', 'Guilford'),  -- 1
    ('HAMDEN', 'Hamden'),  -- 2
    ('hartford', 'Hartford'),  -- 2
    ('killingworth', 'Killingworth'),  -- 2
    ('KILLINGWORTH', 'Killingworth'),  -- 1
    ('manchester', 'Manchester'),  -- 1
    ('MANCHESTER', 'Manchester'),  -- 2
    ('mansfield', 'Mansfield'),  -- 3
    ('meriden', 'Meriden'),  -- 1
    ('MONROE', 'Monroe'),  -- 1
    ('naugatuck', 'Naugatuck'),  -- 1
    ('NEW BRITAIN', 'New Britain'),  -- 1
    ('new canaan', 'New Canaan'),  -- 1
    ('new fairfield', 'New Fairfield'),  -- 2
    ('New fairfield', 'New Fairfield'),  -- 1
    ('new london', 'New London'),  -- 1
    ('new milford', 'New Milford'),  -- 1
    ('newington', 'Newington'),  -- 3
    ('NEWINGTON', 'Newington'),  -- 1
    ('north haven', 'North Haven'),  -- 1
    ('North haven', 'North Haven'),  -- 2
    ('norwalk', 'Norwalk'),  -- 1
    ('Old lyme', 'Old Lyme'),  -- 1
    ('orange', 'Orange'),  -- 1
    ('OXFORD', 'Oxford'),  -- 1
    ('ridgefield', 'Ridgefield'),  -- 3
    ('Rocky hill', 'Rocky Hill'),  -- 2
    ('Rocky HIll', 'Rocky Hill'),  -- 2
    ('RockyHill', 'Rocky Hill'),  -- 1
    ('shelton', 'Shelton'),  -- 1
    ('simsbury', 'Simsbury'),  -- 2
    ('SImsbury', 'Simsbury'),  -- 2
    ('somers', 'Somers'),  -- 1
    ('south windsor', 'South Windsor'),  -- 4
    ('south Windsor', 'South Windsor'),  -- 1
    ('South windsor', 'South Windsor'),  -- 5
    ('South WIndsor', 'South Windsor'),  -- 1
    ('southbury', 'Southbury'),  -- 1
    ('stamford', 'Stamford'),  -- 2
    ('storrs mansfield', 'Storrs'),  -- 1
    ('Storrs Mansfield', 'Storrs'),  -- 5
    ('Storrs, Mansfield', 'Storrs'),  -- 1
    ('suffield', 'Suffield'),  -- 1
    ('SUFFIELD', 'Suffield'),  -- 1
    ('tolland', 'Tolland'),  -- 2
    ('torrington', 'Torrington'),  -- 1
    ('trumbull', 'Trumbull'),  -- 3
    ('TRUMBULL', 'Trumbull'),  -- 1
    ('VERNON', 'Vernon'),  -- 1
    ('west hartford', 'West Hartford'),  -- 4
    ('West hartford', 'West Hartford'),  -- 1
    ('WEST HARTFORD', 'West Hartford'),  -- 1
    ('west haven', 'West Haven'),  -- 1
    ('westport', 'Westport'),  -- 2
    ('wethersfield', 'Wethersfield'),  -- 2
    ('WETHERSFIELD', 'Wethersfield'),  -- 1
    ('willington', 'Willington'),  -- 1
    ('wilton', 'Wilton'),  -- 1
    ('windsor', 'Windsor'),  -- 1
    ('woodbury', 'Woodbury')  -- 1
) AS v(from_city, to_city)
WHERE  r.city = v.from_city;


-- VERIFY
SELECT count(DISTINCT city) AS distinct_spellings FROM referees;
--  before: 306   after: 228 or thereabouts

SELECT city, count(*) FROM referees
WHERE  city ILIKE 'storrs%' OR city ILIKE '%windsor' OR city ILIKE 'vernon'
GROUP  BY city ORDER BY city;
--  expected: Storrs, South Windsor, Windsor, East Windsor, Vernon — one row each, no case variants


-- ROLLBACK
-- UPDATE referees r SET city = b.city
-- FROM referees_city_backup_20260916 b WHERE b.id = r.id;
-- DROP TABLE referees_city_backup_20260916;
