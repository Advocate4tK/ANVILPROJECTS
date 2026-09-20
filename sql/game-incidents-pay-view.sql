-- ============================================================================
-- game_incident_slots — what the pay portal is allowed to see
-- 2026-09-20
--
-- The club pay portal is PIN-gated, not logged in: it reads as anon.
-- game_incidents is RLS'd to authenticated (names, notes, who marked it —
-- personnel data about minors). The pay portal needs exactly one fact per
-- slot: "don't pay this one". So: a view with game, position, kind and
-- nothing else, readable by anon. No names, no notes, no retracted rows.
-- ============================================================================

CREATE OR REPLACE VIEW game_incident_slots
WITH (security_invoker = false) AS
SELECT game_id, position, kind
FROM   game_incidents
WHERE  retracted_at IS NULL;

GRANT SELECT ON game_incident_slots TO anon, authenticated;

-- VERIFY
SELECT * FROM game_incident_slots LIMIT 5;
--  expected: (game_id, position, kind) rows only — no names anywhere

-- ROLLBACK
-- DROP VIEW IF EXISTS game_incident_slots;
