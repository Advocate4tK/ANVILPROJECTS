-- Sheet 2 staging table
-- Stores Eric's Opt slot assignments persistently in Supabase
-- Each row = one ref staged in one Opt slot for one game
-- UNIQUE(game_id, slot) means upsert replaces cleanly

CREATE TABLE IF NOT EXISTS staging (
    id         serial PRIMARY KEY,
    game_id    integer NOT NULL,
    slot       integer NOT NULL CHECK (slot BETWEEN 0 AND 5),
    ref_name   text,
    created_at timestamptz DEFAULT now(),
    UNIQUE (game_id, slot)
);
