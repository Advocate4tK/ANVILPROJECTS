-- ============================================================================
-- Cole Gran / Nicholas Gran — one person, two records
-- 2026-10-20
--
-- Tod: "Cole and Nicholas are the same person... merge and keep Cole data but
-- keep the Nicholas name."
--
-- ⚠️ READ THIS FIRST — IT IS NOT ONE TABLE.
-- A referee is referenced two different ways and they do not move together:
--
--   BY ID      availability, blast_recipients, game_incidents, pool_members
--   BY NAME    games."Center Referee" / "AR 1" / "AR 2" are TEXT columns that
--              hold the referee's NAME — or the literal words FILLED / EMPTY.
--
-- So deleting a row and renaming the survivor leaves every past game still
-- saying the old name, matching nobody. The name half has to be moved
-- deliberately, and that is what section C does.
--
-- ⛔ PART 1 IS READ-ONLY. Run it, look, decide, THEN uncomment part 2.
-- Nothing here deletes a referee until you have seen what is attached.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- PART 1 — LOOK FIRST
-- ════════════════════════════════════════════════════════════════════════════

-- 1a. The two records, side by side. ⭐ The thing that decides everything:
--     do they share a "Central Assign ID"?
--       · same CA ID     → provably one person, CA already agrees
--       · different      → CA thinks they are two, and the duplicate comes back
--                          on the next import unless it is fixed there too
--       · one is blank   → that row is ours alone and is the one to retire
SELECT id,
       "Name", "First Name", "Last Name",
       "Central Assign ID", "Central Assign Name",
       "Date of Birth", age,
       "Email", "Email 2", "Email 3", "Phone",
       "Address", "City", "State", "Zip Code",
       "Guardian Name", "Guardian Email", "Guardian Phone",
       "Years Reffing", "Certification Level", "Status",
       payment_method, email_pref, email_opt_in,
       created_at
FROM   referees
WHERE  "Last Name" ILIKE 'Gran'
    OR "Name" ILIKE '%Gran %'
    OR "Name" ILIKE 'Cole Gran%'
    OR "Name" ILIKE 'Nicholas Gran%'
ORDER  BY id;


-- 1b. What is attached BY ID to each.
--     Whichever id survives inherits all of this; the other row's rows must be
--     repointed before it can go.
WITH pair AS (
    SELECT id, "Name" FROM referees
    WHERE "Name" ILIKE 'Cole Gran%' OR "Name" ILIKE 'Nicholas Gran%'
)
SELECT p.id, p."Name",
       (SELECT count(*) FROM availability        a WHERE a.referee_id = p.id) AS availability_rows,
       (SELECT count(*) FROM blast_recipients    b WHERE b.referee_id = p.id) AS blast_rows,
       (SELECT count(*) FROM game_incidents      g WHERE g.referee_id = p.id) AS incidents,
       (SELECT count(*) FROM pool_members        m WHERE m.referee_id = p.id) AS pool_rows
FROM   pair p
ORDER  BY p.id;


-- 1c. What is attached BY NAME — the games.
--     ⚠️ This is the half that does NOT follow the id.
SELECT 'Center Referee' AS slot, "Center Referee" AS name_in_slot, count(*) AS games,
       min(date) AS first_game, max(date) AS last_game
FROM   games WHERE "Center Referee" ILIKE '%Gran' OR "Center Referee" ILIKE '%Gran %'
GROUP  BY 2
UNION ALL
SELECT 'AR 1', "AR 1", count(*), min(date), max(date)
FROM   games WHERE "AR 1" ILIKE '%Gran' OR "AR 1" ILIKE '%Gran %'
GROUP  BY 2
UNION ALL
SELECT 'AR 2', "AR 2", count(*), min(date), max(date)
FROM   games WHERE "AR 2" ILIKE '%Gran' OR "AR 2" ILIKE '%Gran %'
GROUP  BY 2
ORDER  BY 1, 2;


-- ════════════════════════════════════════════════════════════════════════════
-- PART 2 — THE MERGE.  ⛔ COMMENTED OUT. Fill in the two ids first.
--
-- Tod's instruction: KEEP COLE'S DATA, KEEP NICHOLAS'S NAME.
-- So the surviving ROW is Cole's (it carries the data), and it gets renamed to
-- Nicholas. Nicholas's row is retired.
--
--   :keep  = Cole's id      (the row that survives, and gets the new name)
--   :drop  = Nicholas's id  (the row that goes)
--
-- ⚠️ Set both from part 1a before running a single line of this.
-- ⚠️ Run it inside a transaction so a mistake costs nothing.
-- ════════════════════════════════════════════════════════════════════════════

-- BEGIN;
--
-- -- A. Move everything keyed by ID onto the surviving row.
-- UPDATE availability     SET referee_id = :keep WHERE referee_id = :drop;
-- UPDATE blast_recipients SET referee_id = :keep WHERE referee_id = :drop;
-- UPDATE game_incidents   SET referee_id = :keep WHERE referee_id = :drop;
-- -- ⚠️ pool_members last, and de-duped: if BOTH rows are in the same pool,
-- -- repointing blind would leave the survivor in it twice.
-- DELETE FROM pool_members d
--  WHERE d.referee_id = :drop
--    AND EXISTS (SELECT 1 FROM pool_members k
--                 WHERE k.referee_id = :keep AND k.pool_id = d.pool_id);
-- UPDATE pool_members     SET referee_id = :keep WHERE referee_id = :drop;
--
-- -- B. Take anything the surviving row is MISSING from the row being retired.
-- -- ⭐ coalesce keeps Cole's value wherever he has one, and only fills gaps.
-- -- Tod said keep Cole's data — this does not overwrite any of it.
-- UPDATE referees k SET
--     "Central Assign ID"   = coalesce(k."Central Assign ID",   d."Central Assign ID"),
--     "Central Assign Name" = coalesce(k."Central Assign Name", d."Central Assign Name"),
--     "Date of Birth"       = coalesce(k."Date of Birth",       d."Date of Birth"),
--     age                   = coalesce(k.age,                   d.age),
--     "Email"               = coalesce(nullif(btrim(k."Email"), ''), d."Email"),
--     "Phone"               = coalesce(nullif(btrim(k."Phone"), ''), d."Phone"),
--     "Address"             = coalesce(nullif(btrim(k."Address"), ''), d."Address"),
--     "City"                = coalesce(nullif(btrim(k."City"), ''),    d."City"),
--     "State"               = coalesce(nullif(btrim(k."State"), ''),   d."State"),
--     "Zip Code"            = coalesce(nullif(btrim(k."Zip Code"), ''),d."Zip Code"),
--     "Guardian Name"       = coalesce(nullif(btrim(k."Guardian Name"), ''),  d."Guardian Name"),
--     "Guardian Email"      = coalesce(nullif(btrim(k."Guardian Email"), ''), d."Guardian Email"),
--     "Guardian Phone"      = coalesce(nullif(btrim(k."Guardian Phone"), ''), d."Guardian Phone"),
--     "Years Reffing"       = coalesce(k."Years Reffing",       d."Years Reffing"),
--     "Certification Level" = coalesce(k."Certification Level", d."Certification Level")
-- FROM referees d
-- WHERE k.id = :keep AND d.id = :drop;
--
-- -- C. ⚠️ THE GAMES. These store the NAME, so they must be rewritten by hand.
-- -- Every game that said either old name now says the final name.
-- -- Run 1c again afterwards: every row should show the one name.
-- UPDATE games SET "Center Referee" = 'Nicholas Gran'
--  WHERE "Center Referee" IN ('Cole Gran', 'Nicholas Gran');
-- UPDATE games SET "AR 1" = 'Nicholas Gran'
--  WHERE "AR 1" IN ('Cole Gran', 'Nicholas Gran');
-- UPDATE games SET "AR 2" = 'Nicholas Gran'
--  WHERE "AR 2" IN ('Cole Gran', 'Nicholas Gran');
--
-- -- D. The name on the surviving record.
-- UPDATE referees SET
--     "Name"       = 'Nicholas Gran',
--     "First Name" = 'Nicholas',
--     "Last Name"  = 'Gran'
-- WHERE id = :keep;
--
-- -- E. Only now is the other row free to go.
-- DELETE FROM referees WHERE id = :drop;
--
-- -- Look before you leap:
-- --   SELECT id, "Name", "Central Assign ID", "Email", "Date of Birth"
-- --     FROM referees WHERE id IN (:keep, :drop);
-- -- Happy?  COMMIT;   Not happy?  ROLLBACK;
-- COMMIT;


-- ── AFTER ───────────────────────────────────────────────────────────────────
-- ⚠️ If the two rows had DIFFERENT Central Assign IDs, this merge fixes
-- Referee Tool only. Central Assign still holds two referees, and the next
-- roster import will recreate the duplicate. That has to be fixed in CA as
-- well — see [[feedback_upload_mode]]: match on CA ID first.
