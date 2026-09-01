-- ══════════════════════════════════════════════════════════════════════
-- LEGACY COLUMN CLEANUP — referee-tool Supabase
-- Generated: 2026-04-07
-- Run in DBeaver. Review each section before executing.
-- All columns below are confirmed unused by the workstation code.
-- ══════════════════════════════════════════════════════════════════════

-- ── SAFETY CHECK FIRST ─────────────────────────────────────────────────
-- Run these SELECTs first to confirm legacy columns have no meaningful data.
-- If any return rows, investigate before dropping.

SELECT COUNT(*) AS games_legacy_data FROM games
WHERE home_team IS NOT NULL
   OR away_team IS NOT NULL
   OR age_group IS NOT NULL;

SELECT COUNT(*) AS referees_zip_code_only FROM referees
WHERE zip_code IS NOT NULL AND "Zip Code" IS NULL;

-- ── GAMES TABLE ────────────────────────────────────────────────────────
-- Drop snake_case legacy columns (workstation uses Title Case equivalents)

ALTER TABLE games
    DROP COLUMN IF EXISTS home_team,
    DROP COLUMN IF EXISTS away_team,
    DROP COLUMN IF EXISTS age_group,
    DROP COLUMN IF EXISTS gender,        -- workstation uses "Gender" (Title Case)
    DROP COLUMN IF EXISTS field_id,      -- workstation uses "Field ID" (float4)
    DROP COLUMN IF EXISTS club_id,       -- workstation uses "Source Club" (text)
    DROP COLUMN IF EXISTS uploaded_by,
    DROP COLUMN IF EXISTS league;        -- workstation uses "Source Club" / game_type

-- ── REFEREES TABLE ─────────────────────────────────────────────────────
-- Drop snake_case legacy columns

ALTER TABLE referees
    DROP COLUMN IF EXISTS zip_code,      -- workstation uses "Zip Code" (int4)
    DROP COLUMN IF EXISTS league,
    DROP COLUMN IF EXISTS club_id,       -- workstation uses "Club Preference"
    DROP COLUMN IF EXISTS clubs,         -- workstation uses "Club Preference"
    DROP COLUMN IF EXISTS gender;        -- workstation uses "Gender" (Title Case)

-- ── STAGING3 TABLE ─────────────────────────────────────────────────────
-- Unused table — same structure as staging, never referenced in code

DROP TABLE IF EXISTS staging3;

-- ══════════════════════════════════════════════════════════════════════
-- VERIFY after running:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'games' ORDER BY ordinal_position;
--
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'referees' ORDER BY ordinal_position;
-- ══════════════════════════════════════════════════════════════════════
