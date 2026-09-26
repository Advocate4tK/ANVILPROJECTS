-- ============================================================================
-- The top cup band — 16U-19U, $100 / $60
-- 2026-09-25
--
-- From the published CT Cup policy Tod read out the night of the nor'easter:
--
--     11U-12U   $60 R / $40 ARs     ← already stored, matches
--     13U-14U   $80 R / $50 ARs     ← already stored, matches
--     15U       $90 R / $55 ARs     ← already stored, matches
--     16U-19U  $100 R / $60 ARs     ← missing entirely
--
-- WHY IT MATTERS BEFORE ANY 16U CUP GAME EXISTS
--   league_pay_rates is read by age band. A cup tie with no matching band does
--   not fail — it falls through to the club's own comp rate, quietly, and the
--   referee is short. That already happened once: RTCT11570 exported at 45/30
--   against a real rate of 60/40, $35 light on a single game, and it was only
--   caught by reading the export by hand.
--
--   Cup pay is set by CJSA and plugged in by Central Assign on import. Nobody
--   local gets a vote, which is why leagues.pay_locked is true for both cups —
--   so a wrong number here is not a preference, it is an error.
--
-- ⚠️ STATE CUP IS STILL AN ASSUMPTION.
--   Its three existing rows say "assumed same as Connecticut Cup — confirm"
--   and nothing has confirmed them. The fourth band is added on the same
--   assumption and carries the same warning, so State Cup stays internally
--   consistent rather than being the only competition silently missing its top
--   band. The whole set still needs checking against CJSA's State Cup policy.
-- ============================================================================

INSERT INTO league_pay_rates (league, age_min, age_max, center, ar, note) VALUES
    ('CJSA Connecticut Cup', 16, 19, 100, 60,
     'Published CT Cup policy, read 2026-09-25 — confirmed against the fee table'),
    ('CJSA State Cup',       16, 19, 100, 60,
     'assumed same as Connecticut Cup — confirm')
ON CONFLICT (league, age_min, age_max) DO NOTHING;


-- VERIFY — four bands per cup, no gaps between 11 and 19.
SELECT league, age_min, age_max, center, ar
FROM   league_pay_rates
WHERE  league IN ('CJSA Connecticut Cup', 'CJSA State Cup')
ORDER  BY league, age_min;
--  expected: 8 rows. Connecticut Cup 11-12, 13-14, 15-15, 16-19 and the same
--  four for State Cup.


-- Anything that would still fall through: a cup game whose age matches no band.
SELECT g.game_no, g.date, g."Age Group", g.league
FROM   games g
WHERE  g.is_cup IS TRUE
  AND  NOT EXISTS (
         SELECT 1 FROM league_pay_rates r
         WHERE  r.league = g.league
           AND  (regexp_match(g."Age Group", '\d+'))[1]::int BETWEEN r.age_min AND r.age_max);
--  expected: no rows.


-- ROLLBACK
-- DELETE FROM league_pay_rates WHERE age_min = 16 AND age_max = 19;
