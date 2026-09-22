-- ============================================================================
-- league_pay_rates — fees the competition sets, not the club
-- 2026-09-22
--
-- Tod: "another strange thing about cup pay is it's mandatory that it's these
-- amounts." A cup fee is not a club preference. CJSA sets it, every club pays
-- it, and Central Assign locks the fee fields after import — Eric could move
-- RTCT11570 into the right league but could not touch the money.
--
-- Which is why this is ONE table for everybody rather than a column on
-- pay_rates. A club cannot override a number it was never allowed to choose.
--
-- THE SCHEDULE — Eric Baughman, email "cup pay", 2026-09-22 1:18 PM
--     U11-U12   60 / 40
--     U13-U14   80 / 50
--     U15       90 / 55
--
-- ⚠️ THE BANDS ARE NOT OURS. pay_rates bands U13-U15 as one; the cup splits
-- U13-U14 from U15 and pays them differently. That is exactly why the bands
-- have to live with the LEAGUE instead of being mapped onto the club's grid.
-- Stored as age_min/age_max integers so a lookup is "is 12 between 11 and 12"
-- rather than string-matching a band label that two systems spell differently.
--
-- ⚠️ TWO GAPS, LEFT DELIBERATELY EMPTY
--   Nothing covers U9-U10, and nothing covers U16+. Eric's sheet stops at U15.
--   A missing row must NOT fall back to the club's rate — that is how
--   RTCT11570 went out at 45/30. The export refuses a cup game it has no rate
--   for, visibly, so the answer gets asked for instead of guessed.
--
-- ⚠️ STATE CUP IS AN ASSUMPTION. Eric's sheet is headed "CUP" with no
-- competition named. Both CJSA cups are seeded from it. If State Cup pays
-- differently, change those three rows — nothing else has to move.
-- ============================================================================

CREATE TABLE IF NOT EXISTS league_pay_rates (
    id        bigserial PRIMARY KEY,
    league    text    NOT NULL,        -- must match CA_LEAGUES exactly
    age_min   int     NOT NULL,
    age_max   int     NOT NULL,
    center    numeric NOT NULL,
    ar        numeric,                 -- NULL = this competition uses no ARs at this age
    note      text,
    UNIQUE (league, age_min, age_max)
);

COMMENT ON TABLE league_pay_rates IS
    'Fees mandated by a competition. Beats clubs.pay_rates for any game whose games.league matches. A club cannot override these — CJSA sets them and Central Assign locks the fee fields after import.';

INSERT INTO league_pay_rates (league, age_min, age_max, center, ar, note) VALUES
    ('CJSA Connecticut Cup', 11, 12, 60, 40, 'Eric Baughman, 2026-09-22'),
    ('CJSA Connecticut Cup', 13, 14, 80, 50, 'Eric Baughman, 2026-09-22'),
    ('CJSA Connecticut Cup', 15, 15, 90, 55, 'Eric Baughman, 2026-09-22'),
    ('CJSA State Cup',       11, 12, 60, 40, 'assumed same as Connecticut Cup — confirm'),
    ('CJSA State Cup',       13, 14, 80, 50, 'assumed same as Connecticut Cup — confirm'),
    ('CJSA State Cup',       15, 15, 90, 55, 'assumed same as Connecticut Cup — confirm')
ON CONFLICT (league, age_min, age_max) DO NOTHING;

ALTER TABLE league_pay_rates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS league_pay_rates_read ON league_pay_rates;
-- The club pay portal is PIN-gated and reads as anon; it needs these to show a
-- cup game's correct fee. They are published rates, not personal data.
CREATE POLICY league_pay_rates_read ON league_pay_rates FOR SELECT TO anon, authenticated USING (true);


-- VERIFY
SELECT league, age_min, age_max, center, ar FROM league_pay_rates ORDER BY league, age_min;
--  expected: 6 rows

SELECT g.game_no, g."Age Group", g.league, r.center, r.ar
FROM   games g
JOIN   league_pay_rates r
       ON r.league = g.league
      AND (regexp_match(g."Age Group", '\d+'))[1]::int BETWEEN r.age_min AND r.age_max
WHERE  g.league IS NOT NULL;
--  expected: 11570 | U12 Boys | CJSA Connecticut Cup | 60 | 40
--  (it exported at 45/30 — the club's U11-U12 comp band. $35 short on the game.)


-- ROLLBACK
-- DROP TABLE IF EXISTS league_pay_rates;
