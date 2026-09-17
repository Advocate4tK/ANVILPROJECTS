-- ============================================================================
-- pay_rates.game_type — tag the comp bands as comp
-- 2026-09-17
--
-- Every band row (U9-U10, U11-U12, U13-U15) across all 11 clubs reads
-- game_type = 'rec'. They are the COMP rates — the pay lookup has always
-- read the band for a comp game and the exact age for rec, which is why it
-- kept working. But anything that trusted the column instead of the shape
-- (the openings email's pay block, for one) had no way to tell them apart,
-- and "U9-U10 AR $25" sat next to "U10 no AR" unexplained.
--
-- Tod, 2026-09-17: "so the U9-U10" ... "yes" to fixing the data.
--
-- 33 rows. Nothing else on the row changes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS pay_rates_backup_20260917 AS
    SELECT id, game_type FROM pay_rates;

UPDATE pay_rates
SET    game_type = 'comp'
WHERE  age_group ~* '^U\d+\s*-\s*U\d+$'
  AND  lower(coalesce(game_type, '')) <> 'comp';


-- VERIFY
SELECT game_type, count(*),
       string_agg(DISTINCT age_group, ', ' ORDER BY age_group) AS age_groups
FROM   pay_rates GROUP BY game_type;
--  expected: comp 33 → U11-U12, U13-U15, U9-U10
--            rec  38 → the bare ages

SELECT age_group, game_type, center, ar
FROM   pay_rates WHERE club_id = 52
ORDER  BY game_type, (regexp_match(age_group, '\d+'))[1]::int;
--  expected NECONN: comp U9-U10/U11-U12/U13-U15, rec U8/U10/U12/U15/U19


-- ROLLBACK
-- UPDATE pay_rates p SET game_type = b.game_type
-- FROM pay_rates_backup_20260917 b WHERE b.id = p.id;
