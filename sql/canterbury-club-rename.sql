-- ============================================================================
-- Canterbury: follow Central Assign's corrected club name
-- 2026-09-10
--
-- Central Assign has fixed its own spelling. Their club dropdown now reads
-- "Canterbury Soccer Club"; it used to read "Cantebury Soccer Club", missing the
-- second r. Tod got it corrected at the source.
--
-- ⚠️ WE MIRROR CA, WE DO NOT LEAD IT. Tod, 2026-09-10: "the bottom line will
--    always be central assign." Until today the misspelling was CORRECT for us,
--    because an export carrying anything else was a row CA would reject. Now the
--    opposite is true, so we move.
--
-- ⚠️ RUN THIS AS SQL, NOT FROM THE APP. ca_clubs is protected by RLS: an update
--    through the public key affects zero rows AND RETURNS NO ERROR. An earlier
--    attempt to add an alias this way reported success and changed nothing.
-- ============================================================================

BEGIN;

-- 1. The club list itself. The old spelling becomes an alias rather than being
--    discarded: 77 game rows, every CSV a club has already built, and any file
--    sitting in a download folder still say "Cantebury". They must keep
--    resolving.
UPDATE ca_clubs
SET    name    = 'Canterbury Soccer Club',
       aliases = ARRAY['Cantebury Soccer Club',
                       'Canterbury Athletic Association',
                       'Canterbury']
WHERE  name = 'Cantebury Soccer Club';

-- 2. Games already carrying the old name — 54 as the away club, 23 as home.
UPDATE games SET away_club = 'Canterbury Soccer Club' WHERE away_club = 'Cantebury Soccer Club';
UPDATE games SET home_club = 'Canterbury Soccer Club' WHERE home_club = 'Cantebury Soccer Club';

COMMIT;


-- ---------------------------------------------------------------------------
-- VERIFY
-- ---------------------------------------------------------------------------

SELECT name, aliases FROM ca_clubs WHERE name ILIKE '%canterbury%' OR name ILIKE '%cantebury%';
--  expected: one row, "Canterbury Soccer Club", with the old spelling among its aliases

SELECT count(*) FILTER (WHERE away_club = 'Cantebury Soccer Club')  AS old_away,
       count(*) FILTER (WHERE home_club = 'Cantebury Soccer Club')  AS old_home,
       count(*) FILTER (WHERE away_club = 'Canterbury Soccer Club') AS new_away,
       count(*) FILTER (WHERE home_club = 'Canterbury Soccer Club') AS new_home
FROM   games;
--  expected: old_away 0, old_home 0, new_away 54, new_home 23


-- ---------------------------------------------------------------------------
-- NOT CHANGED, deliberately
-- ---------------------------------------------------------------------------
-- clubs.name        'canterbury-athletic-association'  — the URL slug. Changing
--                   it breaks referee-tool.com/canterbury/* and every portal
--                   link already handed to the club.
-- clubs."Club Name" 'Canterbury Athletic Association'  — their legal name, which
--                   is genuinely different from CA's name for them. That is what
--                   the alias list is for.
-- venues.club_name  follows clubs, not ca_clubs.


-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- BEGIN;
-- UPDATE ca_clubs SET name = 'Cantebury Soccer Club',
--        aliases = ARRAY['Canterbury Athletic Association','Canterbury']
--  WHERE name = 'Canterbury Soccer Club';
-- UPDATE games SET away_club = 'Cantebury Soccer Club' WHERE away_club = 'Canterbury Soccer Club';
-- UPDATE games SET home_club = 'Cantebury Soccer Club' WHERE home_club = 'Canterbury Soccer Club';
-- COMMIT;
