-- ============================================================================
-- game_incidents gains 'ca_rejected'
-- 2026-09-23
--
-- Tod: "after a referee rejects a game in CA... that ref should be taken off
-- the game and marked on the side as (xCA) for that game if we try to place
-- them back on."
--
-- WHY THE RED CHIP CANNOT BE THE MEMORY
--   Declining means the slot is OPEN again — the referee's name comes out of
--   it. Once it is out, ca_rejected_positions has nothing to hang on: the
--   column knows a POSITION declined, not WHO declined it, and the next
--   referee dropped into that slot would inherit a red mark that was never
--   about them.
--
--   So the decline becomes an incident: game + referee + position + when.
--   That survives the slot being refilled, and it is what the referee pane
--   reads to say "Emily Tessier declined this one in CA" when you go to place
--   her back on the same fixture.
--
-- Same table as no-shows and late scratches, which is right: all three are
-- "what this referee did about a game they were given". Same retract rule —
-- nothing is deleted, a mistake is withdrawn.
-- ============================================================================

ALTER TABLE game_incidents DROP CONSTRAINT IF EXISTS game_incidents_kind_check;
ALTER TABLE game_incidents ADD  CONSTRAINT game_incidents_kind_check
    CHECK (kind IN ('no_show', 'late_scratch', 'ca_rejected'));

COMMENT ON COLUMN game_incidents.kind IS
    'no_show — assigned, did not turn up. late_scratch — bailed inside 24h. ca_rejected — declined the assignment in Central Assign, so the slot went back out.';


-- VERIFY
SELECT conname, pg_get_constraintdef(oid)
FROM   pg_constraint
WHERE  conrelid = 'game_incidents'::regclass AND conname = 'game_incidents_kind_check';
--  expected: CHECK (kind = ANY (ARRAY['no_show', 'late_scratch', 'ca_rejected']))

SELECT kind, count(*) FROM game_incidents GROUP BY kind;
--  nothing is ca_rejected yet — Emily Tessier on RTCT11566 will be the first


-- ROLLBACK
-- ALTER TABLE game_incidents DROP CONSTRAINT IF EXISTS game_incidents_kind_check;
-- ALTER TABLE game_incidents ADD  CONSTRAINT game_incidents_kind_check
--     CHECK (kind IN ('no_show', 'late_scratch'));
