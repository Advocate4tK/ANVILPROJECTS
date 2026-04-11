-- Sheet 3 staging table migration
-- Run in DBeaver before using Sheet 3 in production
-- Sheet 3 now reads/writes staging3 (NOT staging) to prevent cross-sheet data collisions

-- 1. Create staging3 if it doesn't exist
CREATE TABLE IF NOT EXISTS staging3 (
    id         serial PRIMARY KEY,
    game_id    integer NOT NULL,
    slot       integer NOT NULL,
    ref_name   text,
    created_at timestamptz DEFAULT now(),
    UNIQUE (game_id, slot)
);

-- 2. Remove the slot range check constraint if it exists (queue can exceed 6 slots)
--    Run this only if the table was created with the CHECK constraint
ALTER TABLE staging3 DROP CONSTRAINT IF EXISTS staging3_slot_check;

-- 3. If staging already had Sheet 3 data mixed in (before this fix),
--    you can optionally migrate it. In most cases a fresh start is fine.
-- INSERT INTO staging3 (game_id, slot, ref_name)
--     SELECT game_id, slot, ref_name FROM staging ON CONFLICT DO NOTHING;
