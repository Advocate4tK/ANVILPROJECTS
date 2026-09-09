-- ============================================================================
-- Crew rules: split by game type (Comp vs Rec)
-- 2026-09-09
--
-- WHY: crew_rules is keyed on club_id + age_group only. That was enough while
--      every client played ONE kind of soccer. Tod, 2026-09-09:
--
--        "comp games, if they're U10, must have ARs. If they're rec games,
--         they don't."
--        "We didn't have to deal with this before because East Haddam and
--         Griswold were both comp clubs."
--
--      NECONN plays both. Its single U10 rule (ar1=false, ar2=false) is correct
--      for its 78 rec games and wrong for its 9 comp games. Proof it is already
--      costing us data: game 3012 (Sat 9/12, U10 comp, Nichols vs Campbell) is
--      crewed in Central Assign with THREE officials -
--          REF Deegan Bryniarski / AR1 Lucie Ledogar / AR2 Ryan Turbesi
--      but our row has "AR 1" and "AR 2" NULL, because the crew rule says this
--      club's U10 games have no AR slots. The two AR assignments have nowhere
--      to live.
--
-- MIXED CLUBS (measured 2026-09-09, from the games table):
--      NECONN        Comp   9   Rec  78
--      Lebanon       Comp   3   Rec  28
--      RHAMYS        Comp  10   Rec   4
--      East Haddam   Comp  29   Rec   1   <- the 1 is a U19 HS game, likely mislabelled
--      Griswold      Comp  30   Rec   0   <- rec side runs, just never uploaded
-- ============================================================================


-- ---------------------------------------------------------------------------
-- ⚠️ THE DESIGN: NULL means "applies to both types".
--
-- Do NOT backfill existing rows to 'Rec'. It is tempting and it is wrong -
-- East Haddam and Griswold are comp-only, so THEIR existing rows describe comp
-- games. Stamping the whole table 'Rec' would misfile every one of them.
--
-- Instead:
--      game_type IS NULL   -> the club-wide default, what we have today
--      game_type = 'Comp'  -> overrides the default for comp games only
--      game_type = 'Rec'   -> overrides the default for rec games only
--
-- Lookup order in crewAllowed(): exact type match first, then the NULL row,
-- then permissive (true). So on the day this ships, with zero Comp/Rec rows
-- written, EVERY club behaves exactly as it does now. Nothing moves until a
-- box is ticked. That is what makes this safe to run mid-season.
-- ---------------------------------------------------------------------------

ALTER TABLE crew_rules
    ADD COLUMN IF NOT EXISTS game_type text;

ALTER TABLE crew_rules
    DROP CONSTRAINT IF EXISTS crew_rules_game_type_check;
ALTER TABLE crew_rules
    ADD CONSTRAINT crew_rules_game_type_check
    CHECK (game_type IS NULL OR game_type IN ('Comp', 'Rec'));


-- ---------------------------------------------------------------------------
-- ⚠️ THE EXISTING UNIQUE CONSTRAINT MUST GO FIRST.
--
-- manage-clubs.html saves with:
--     .upsert(rows, { onConflict: 'club_id,age_group' })
-- so there is a UNIQUE (club_id, age_group) on this table today. Leaving it in
-- place makes the whole migration pointless: adding a 'Comp' row for NECONN
-- U10 collides with the existing U10 row and is rejected as a duplicate key.
-- The column would exist and no second rule could ever be written.
--
-- The constraint name is not assumed - this finds whichever unique constraint
-- covers exactly (club_id, age_group) and drops it, so it works whatever the
-- table was named at creation.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
    c record;
BEGIN
    FOR c IN
        SELECT con.conname
        FROM   pg_constraint con
        JOIN   pg_class      rel ON rel.oid = con.conrelid
        WHERE  rel.relname = 'crew_rules'
          AND  con.contype = 'u'
          AND  (SELECT array_agg(att.attname::text ORDER BY att.attname)
                FROM   unnest(con.conkey) k
                JOIN   pg_attribute att
                  ON   att.attrelid = con.conrelid AND att.attnum = k)
              = ARRAY['age_group','club_id']
    LOOP
        EXECUTE format('ALTER TABLE crew_rules DROP CONSTRAINT %I', c.conname);
        RAISE NOTICE 'dropped unique constraint %', c.conname;
    END LOOP;
END $$;

-- Same for a bare unique INDEX on those two columns, if one exists instead.
DROP INDEX IF EXISTS crew_rules_club_id_age_group_key;
DROP INDEX IF EXISTS crew_rules_club_id_age_group_idx;


-- ---------------------------------------------------------------------------
-- Uniqueness, rebuilt. Postgres treats NULLs as DISTINCT in a normal unique
-- constraint, so a plain UNIQUE (club_id, age_group, game_type) would happily
-- allow two NULL rows for the same club+age. Two partial indexes instead:
--   one for the typed rows, one for the single NULL default row.
--
-- ⚠️ AFTER THIS RUNS, saveCrewRules() in manage-clubs.html can no longer upsert
--    on 'club_id,age_group' - that target no longer exists and the call will
--    error. The save path must move to delete-then-insert per club, the same
--    shape pay_rates already uses at manage-clubs.html:3213. Do not run this
--    migration and leave the old save code in place.
-- ---------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS crew_rules_club_age_type_uniq
    ON crew_rules (club_id, age_group, game_type)
    WHERE game_type IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS crew_rules_club_age_default_uniq
    ON crew_rules (club_id, age_group)
    WHERE game_type IS NULL;


-- ---------------------------------------------------------------------------
-- VERIFY - run these before touching any application code.
-- ---------------------------------------------------------------------------

-- 1. Column exists, nullable, constrained.
SELECT column_name, data_type, is_nullable
FROM   information_schema.columns
WHERE  table_name = 'crew_rules' AND column_name = 'game_type';
--  expected:  game_type | text | YES

-- 2. Every existing row is still NULL. If this returns anything but 0,
--    something backfilled and the "nothing changes" guarantee is void.
SELECT count(*) AS typed_rows_should_be_zero
FROM   crew_rules
WHERE  game_type IS NOT NULL;
--  expected: 0

-- 3. NECONN's rules, unchanged.
SELECT age_group, ar1, ar2, game_type
FROM   crew_rules
WHERE  club_id = 52
ORDER  BY age_group;
--  expected: 10 rows, game_type NULL on all of them,
--            U8/U9/U10 false/false, U11-U18 true/true


-- ---------------------------------------------------------------------------
-- ⚠️ DO NOT RUN YET - this is the NECONN fix, for AFTER the UI ships.
--    Written here so the intent is on the record, commented out so it cannot
--    fire early. Adding this row while the code still ignores game_type would
--    do nothing; adding it after is the whole point.
--
--    U9 comp: Tod, 2026-09-09, "I think U9 does get ARs." Note the "I think" -
--    this one is his best recollection, not a checked rule, unlike U10 which he
--    stated flatly. It affects the three Cante games (3016/3017/3018, all Oct).
--    If it turns out U9 comp is single-ref, delete that one row - nothing else
--    depends on it. Confirm against the NED rulebook when convenient.
-- ---------------------------------------------------------------------------

-- INSERT INTO crew_rules (club_id, age_group, ar1, ar2, game_type)
-- VALUES (52, 'U10', true, true, 'Comp'),
--        (52, 'U9',  true, true, 'Comp');


-- ---------------------------------------------------------------------------
-- ROLLBACK, if this needs to come out.
-- Safe: no existing row depends on the new column.
-- ---------------------------------------------------------------------------

-- DROP INDEX IF EXISTS crew_rules_club_age_default_uniq;
-- DROP INDEX IF EXISTS crew_rules_club_age_type_uniq;
-- ALTER TABLE crew_rules DROP CONSTRAINT IF EXISTS crew_rules_game_type_check;
-- ALTER TABLE crew_rules DROP COLUMN IF EXISTS game_type;
