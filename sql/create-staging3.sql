-- Sheet 3 staging table
-- Independent copy of the staging table for Sheet 3's Opt slot assignments
-- Same schema as staging — separate table so Sheet 2 and Sheet 3 don't share staged data
-- Run in DBeaver before using Sheet 3

CREATE TABLE IF NOT EXISTS staging3 (
    id         serial PRIMARY KEY,
    game_id    integer NOT NULL,
    slot       integer NOT NULL CHECK (slot BETWEEN 0 AND 5),
    ref_name   text,
    created_at timestamptz DEFAULT now(),
    UNIQUE (game_id, slot)
);
