-- ============================================================================
-- games.ca_change_synced_at — did Central Assign get the change?
-- 2026-09-22
--
-- Tod: "I did two change controls and sure they show in our system but I need
-- to pump them out to CA ... when they get to the Change page we need a final
-- aspect that confirms CA got the change (if they exist in CA)."
--
-- WHY THIS IS A CHECKBOX AND NOT AN EXPORT
--   Central Assign's CSV importer ADDS games. It has no update path — a
--   re-export of a fixture CA already holds creates a second one beside the
--   first at the old time, which is worse than the stale row. So when a game
--   that has already been imported gets rescheduled here, somebody has to
--   change it BY HAND in CA. This records that they did.
--
-- WHO NEEDS IT
--   Only a game CA actually has. Of the four recent changes:
--     RTCT11567  imported 2026-09-21, retimed tonight  → CA is stale
--     RTCT10246  imported 2026-09-21, moved tonight    → CA is stale
--     RTCT10214  never imported, cancelled             → nothing to do
--     RTCT10221  never imported, cancelled             → nothing to do
--   A game CA never received carries its change out on the next export by
--   itself. Asking about those would be noise, and noise is how a real one
--   gets ignored.
--
--   Cancellations count too: a game cancelled here is still live in CA.
--
-- NULL means "not yet confirmed in CA". It is deliberately not defaulted —
-- every existing row starts unconfirmed and the page decides which of them
-- actually needs asking about.
-- ============================================================================

ALTER TABLE games ADD COLUMN IF NOT EXISTS ca_change_synced_at timestamptz;

COMMENT ON COLUMN games.ca_change_synced_at IS
    'When this game''s change was applied BY HAND in Central Assign. Only meaningful for games CA already holds (ca_imported_at set) that were rescheduled or cancelled afterwards — CA''s importer cannot update, only add. NULL = CA may still show the old details.';

CREATE INDEX IF NOT EXISTS games_ca_change_pending_idx
    ON games (ca_imported_at)
    WHERE ca_imported_at IS NOT NULL AND ca_change_synced_at IS NULL;


-- VERIFY — the games where Central Assign is currently out of date.
-- A game qualifies when CA has it AND something changed here afterwards.
SELECT game_no, date, time, "Source Club", "Home Team", "Away Team", "Game Status",
       ca_imported_at, cancelled_at, ca_change_synced_at
FROM   games
WHERE  ca_imported_at IS NOT NULL
  AND  ca_change_synced_at IS NULL
  AND  ( "Game Status" IN ('Change Resolved', 'Cancelled')
      OR cancelled_at > ca_imported_at )
ORDER  BY date;
--  expected right now: RTCT11567 and RTCT10246 — the two Tod resolved
--  2026-09-22 evening, both imported to CA on 2026-09-21.


-- ROLLBACK
-- ALTER TABLE games DROP COLUMN IF EXISTS ca_change_synced_at;
