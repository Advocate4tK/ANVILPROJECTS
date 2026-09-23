-- ============================================================================
-- games.ca_assigned_positions — in Central Assign, not yet accepted
-- 2026-09-22
--
-- Central Assign requires the REFEREE to accept. Our one green tick only ever
-- meant "I put them in CA", which is the start of that, not the end.
--
-- Tod, 2026-09-22:
--   "Ava I put in CA and I checked OUR green CA button to confirm I put her
--    there... and then she accepted... meaning I should somehow confirm it was
--    taken."
--   "Mark Drega I put in CA but he rejected his game. I had checked the CA
--    button... but thats confusing because he rejected it."
--
-- So the chip gets three states:
--     ○ CA          not in Central Assign
--     ◑ CA  amber   assigned in CA, AWAITING the referee's acceptance
--     ✓ CA  green   referee accepted
--     ✗ CA  red     referee DECLINED it in CA
--
-- ca_assigned_positions holds the amber set; ca_confirmed_positions keeps its
-- meaning and becomes the green set. Same comma-separated shape, so every
-- reader that already parses one can parse the other.
--
-- MIGRATION: every existing tick moves to AMBER.
--   That is what the click actually meant at the time — "I put them in CA" —
--   and the whole complaint is that it could not tell Ava-accepted from
--   Mark-rejected. 10 slots across 4 upcoming games as of tonight, so this is
--   ten clicks to sort out, once, after which every chip means what it says.
--   Past games are left alone; nobody is going back to re-tick September.
-- ============================================================================

ALTER TABLE games ADD COLUMN IF NOT EXISTS ca_assigned_positions text;
ALTER TABLE games ADD COLUMN IF NOT EXISTS ca_rejected_positions text;

COMMENT ON COLUMN games.ca_rejected_positions IS
    'Positions the referee DECLINED in Central Assign — the red state. The referee stays in the slot so it is visible who turned it down; removing them is a separate, deliberate act.';
COMMENT ON COLUMN games.ca_assigned_positions IS
    'Positions put into Central Assign but NOT yet accepted by the referee — the amber state. Comma-separated, same shape as ca_confirmed_positions. A position in here and not in ca_confirmed_positions is awaiting acceptance.';

-- Everything currently ticked becomes "assigned, awaiting acceptance".
UPDATE games
SET    ca_assigned_positions = ca_confirmed_positions,
       ca_confirmed_positions = ''
WHERE  coalesce(ca_confirmed_positions, '') <> ''
  AND  date >= current_date;


-- VERIFY
SELECT game_no, date, "Source Club", "Home Team",
       ca_assigned_positions AS awaiting, ca_confirmed_positions AS accepted,
       ca_rejected_positions AS declined
FROM   games
WHERE  coalesce(ca_assigned_positions, '') <> ''
   OR  coalesce(ca_confirmed_positions, '') <> ''
ORDER  BY date;
--  expected: the 4 upcoming games now show their positions under `awaiting`
--  and nothing under `accepted`. Ava's slots get promoted by hand; Mark
--  Drega's and Eli Klancko's come back out when the red state ships.


-- ROLLBACK — put the ticks back as they were
-- UPDATE games SET ca_confirmed_positions = ca_assigned_positions,
--                  ca_assigned_positions  = NULL
-- WHERE coalesce(ca_assigned_positions, '') <> '';
-- ALTER TABLE games DROP COLUMN IF EXISTS ca_assigned_positions;
-- ALTER TABLE games DROP COLUMN IF EXISTS ca_rejected_positions;
