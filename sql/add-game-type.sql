-- Add game_type column to games table
-- Values: 'Rec' or 'Comp'
-- Run this in DBeaver against the Supabase database

ALTER TABLE games ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT 'Rec';

-- Verify
SELECT id, game_type FROM games LIMIT 5;
