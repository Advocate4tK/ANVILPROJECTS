-- ============================================================================
-- NFHS entities — officials associations, and turning Central Assign off
-- 2026-10-23
--
-- Tod wants a fourth button on Create Entity: press NFHS, create CMSOA or
-- ECSOA. Those are regional officials ASSOCIATIONS — Central Mass and Eastern
-- Connecticut — not clubs. Their assignors deal with an athletic director at
-- each member school, the state sets the pay, and it changes most seasons.
--
-- ⭐ WHY TWO FLAGS AND NOT A NEW TABLE.
-- An association needs almost everything a club row already has: contacts,
-- assignors, venues, portal settings, an enabled switch, a place in Entity
-- Status. A separate table would duplicate all of it and every page would need
-- a second code path. Two columns say how a row BEHAVES, which is the part
-- that actually differs.
--
-- ⚠️ CENTRAL ASSIGN IS A CONNECTICUT YOUTH SYSTEM. CMSOA is in Massachusetts
-- and runs on Arbiter. The moment Tod created it, Entity Status told him "CA
-- UPLOAD INCOMPLETE" — measuring a Massachusetts association against a system
-- it will never touch. uses_central_assign ends that, and it is a FLAG rather
-- than a guess from state or type: a guess gets it wrong the first time a
-- Rhode Island club does use something CA-like, or a Connecticut organisation
-- does not.
--
-- ⛔ COLUMNS ON AN EXISTING TABLE, so no GRANTs needed — see
-- reference_supabase_new_table_grants, which applies to NEW tables from
-- 2026-10-30.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================

-- Which rule book this entity plays under.
--   'ussf' — youth soccer, age groups U8-U19, club pay grids, Central Assign
--   'nfhs' — high school, Varsity/JV/Freshman, state pay scale, Arbiter
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS rule_set text NOT NULL DEFAULT 'ussf';

-- Does this entity's work reach Central Assign at all?
-- ⚠️ DEFAULT TRUE so every club that exists today keeps behaving exactly as it
-- does. Only a row that says otherwise changes.
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS uses_central_assign boolean NOT NULL DEFAULT true;

-- Only two rule sets today; the check keeps a typo from quietly creating a
-- third that nothing knows how to render.
ALTER TABLE clubs DROP CONSTRAINT IF EXISTS clubs_rule_set_valid;
ALTER TABLE clubs ADD  CONSTRAINT clubs_rule_set_valid CHECK (rule_set IN ('ussf', 'nfhs'));

COMMENT ON COLUMN clubs.rule_set IS
    'ussf = youth soccer (age groups, club pay grid, Central Assign). nfhs = high school (Varsity/JV, state pay scale, Arbiter). Decides vocabulary and which readiness checks apply.';
COMMENT ON COLUMN clubs.uses_central_assign IS
    'FALSE for anything outside Central Assign''s reach - out of state, or high school. Suppresses the CA UPLOAD INCOMPLETE badge and the district requirement. A flag, never inferred: a guess from state or type gets it wrong the first time an exception appears.';

-- An association is a parent for its member schools. NULL for everything else.
-- ⚠️ No cascade: deleting an association must NOT silently delete the schools
-- under it, each of which has its own games and its own history.
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS parent_club_id bigint
    REFERENCES clubs(id) ON DELETE SET NULL;

COMMENT ON COLUMN clubs.parent_club_id IS
    'The officials association a school belongs to. NULL for a standalone club. Set null on delete - removing an association must never take its schools with it.';

CREATE INDEX IF NOT EXISTS clubs_parent_idx ON clubs (parent_club_id) WHERE parent_club_id IS NOT NULL;


-- VERIFY ---------------------------------------------------------------------

-- The three new columns, with their defaults.
SELECT column_name, data_type, column_default, is_nullable
FROM   information_schema.columns
WHERE  table_name = 'clubs'
  AND  column_name IN ('rule_set', 'uses_central_assign', 'parent_club_id')
ORDER  BY column_name;

-- ⚠️ EVERY EXISTING CLUB MUST READ ussf / true. If any row says otherwise the
-- defaults did not apply and something will quietly behave differently.
SELECT rule_set, uses_central_assign, count(*)
FROM   clubs
GROUP  BY 1, 2
ORDER  BY 1, 2;


-- ROLLBACK -------------------------------------------------------------------
-- ALTER TABLE clubs DROP CONSTRAINT IF EXISTS clubs_rule_set_valid;
-- DROP INDEX IF EXISTS clubs_parent_idx;
-- ALTER TABLE clubs DROP COLUMN IF EXISTS parent_club_id;
-- ALTER TABLE clubs DROP COLUMN IF EXISTS uses_central_assign;
-- ALTER TABLE clubs DROP COLUMN IF EXISTS rule_set;
