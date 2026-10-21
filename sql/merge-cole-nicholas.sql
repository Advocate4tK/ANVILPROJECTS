-- ============================================================================
-- Cole Gran / Nicholas Gran — one person, two records
-- 2026-10-20, rewritten 2026-10-21 against the REAL schema
--
-- Tod: "Cole and Nicholas are the same person... merge and keep Cole data but
-- keep the Nicholas name."
--
-- ⚠️ COLUMN NAMES, BECAUSE I GOT THEM WRONG THREE TIMES. The pages use
-- Airtable-era labels (f['Name'], f['First Name']) and js/supabase-client.js
-- maps them. The DATABASE has:
--     referees.name        lowercase, ONE column — there is no First/Last
--     referees.email / phone / address / city / state   lowercase
--     referees."Zip Code" / "Date of Birth" / "Central Assign ID"
--     referees."Guardian Name" / "Guardian Email" / "Guardian Phone"
--     games."Center Referee" / "AR 1" / "AR 2"   varchar, holding a NAME
--
-- ⚠️ A REFEREE IS REFERENCED THREE WAYS, AND THEY DO NOT MOVE TOGETHER:
--     BY ID    availability.referee_id, blast_recipients.referee_id,
--              game_incidents.referee_id, pool_members.referee_id
--     BY NAME  games."Center Referee"/"AR 1"/"AR 2" — which also hold the
--              literal words FILLED and EMPTY, so the column can never
--              simply become an id
--     BY NAME AGAIN  availability."Name" / "Referee Name" / referee, and
--              game_incidents.referee_name — denormalised copies
--
-- ⭐ referees.aliases EXISTS. The old name goes in there rather than being
-- lost: a Central Assign import that still says "Cole Gran" can then be
-- recognised instead of creating this duplicate all over again.
--
-- ⛔ PART 1 IS READ-ONLY. Run it, look, decide, THEN fill in the ids.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- PART 1 — LOOK FIRST
-- ════════════════════════════════════════════════════════════════════════════

-- 1a. The two records side by side.
--     ⭐ THE QUESTION THAT DECIDES EVERYTHING: do they share a
--     "Central Assign ID"?
--       · same        → provably one person, CA already agrees
--       · different   → CA holds two referees, and the next roster import
--                       recreates this duplicate unless it is fixed there too
--       · one blank   → that row is ours alone; it is the one to retire
SELECT id,
       name,
       "Central Assign ID", "Central Assign Name", "Referee ID",
       "Date of Birth", age, registration_year,
       email, "Email 2", "Email 3", phone,
       address, city, state, "Zip Code",
       "Guardian Name", "Guardian Email", "Guardian Phone",
       "Years Reffing", "Certification Level", status,
       payment_method, venmo, email_pref, email_opt_in,
       aliases, source_club, created_at
FROM   referees
WHERE  name ILIKE '%gran'
    OR name ILIKE '%gran %'
ORDER  BY id;


-- 1b. What is attached BY ID to each.
WITH pair AS (
    SELECT id, name FROM referees
    WHERE  name ILIKE 'Cole Gran%' OR name ILIKE 'Nicholas Gran%'
)
SELECT p.id, p.name,
       (SELECT count(*) FROM availability     a WHERE a.referee_id = p.id) AS availability_rows,
       (SELECT count(*) FROM blast_recipients b WHERE b.referee_id = p.id) AS blast_rows,
       (SELECT count(*) FROM game_incidents   g WHERE g.referee_id = p.id) AS incidents,
       (SELECT count(*) FROM pool_members     m WHERE m.referee_id = p.id) AS pool_rows
FROM   pair p
ORDER  BY p.id;


-- 1c. What is attached BY NAME — the games. ⚠️ This half does NOT follow the id.
SELECT 'Center Referee' AS slot, "Center Referee" AS name_in_slot,
       count(*) AS games, min(date) AS first_game, max(date) AS last_game
FROM   games WHERE "Center Referee" ILIKE '%Gran%' GROUP BY 2
UNION ALL
SELECT 'AR 1', "AR 1", count(*), min(date), max(date)
FROM   games WHERE "AR 1" ILIKE '%Gran%' GROUP BY 2
UNION ALL
SELECT 'AR 2', "AR 2", count(*), min(date), max(date)
FROM   games WHERE "AR 2" ILIKE '%Gran%' GROUP BY 2
ORDER  BY 1, 2;


-- 1d. The other name copies — availability and incidents carry their own.
SELECT 'availability' AS tbl, referee_id, "Name" AS n1, "Referee Name" AS n2, referee AS n3, count(*)
FROM   availability
WHERE  "Name" ILIKE '%Gran%' OR "Referee Name" ILIKE '%Gran%' OR referee ILIKE '%Gran%'
GROUP  BY 2,3,4,5
UNION ALL
SELECT 'game_incidents', referee_id, referee_name, NULL, NULL, count(*)
FROM   game_incidents WHERE referee_name ILIKE '%Gran%'
GROUP  BY 2,3;


-- ════════════════════════════════════════════════════════════════════════════
-- PART 2 — THE MERGE.  ⛔ COMMENTED OUT. Replace <KEEP> and <DROP> first.
--
-- Tod: KEEP COLE'S DATA, KEEP NICHOLAS'S NAME.
-- So COLE's row survives (it carries the data) and is renamed to Nicholas.
-- Nicholas's row is retired.
--
--   <KEEP> = Cole's id       — survives, gets the Nicholas name
--   <DROP> = Nicholas's id   — goes
--
-- ⚠️ Set both from 1a before running a line of this. It runs in a
-- transaction, so a mistake costs nothing until COMMIT.
-- ════════════════════════════════════════════════════════════════════════════

-- BEGIN;
--
-- -- A. Everything keyed BY ID moves to the surviving row.
-- UPDATE availability     SET referee_id = <KEEP> WHERE referee_id = <DROP>;
-- UPDATE blast_recipients SET referee_id = <KEEP> WHERE referee_id = <DROP>;
-- UPDATE game_incidents   SET referee_id = <KEEP> WHERE referee_id = <DROP>;
-- -- ⚠️ pool_members has a UNIQUE (pool_id, referee_id). If both rows sit in
-- -- the same pool a blind repoint violates it, so drop the loser's row first.
-- DELETE FROM pool_members d
--  WHERE d.referee_id = <DROP>
--    AND EXISTS (SELECT 1 FROM pool_members k
--                 WHERE k.referee_id = <KEEP> AND k.pool_id = d.pool_id);
-- UPDATE pool_members     SET referee_id = <KEEP> WHERE referee_id = <DROP>;
--
-- -- B. Fill ONLY the gaps on the surviving row from the one being retired.
-- -- ⭐ coalesce never overwrites a value Cole already has — Tod said keep
-- -- Cole's data, and this keeps all of it.
-- UPDATE referees k SET
--     "Central Assign ID"   = coalesce(k."Central Assign ID",   d."Central Assign ID"),
--     "Central Assign Name" = coalesce(nullif(btrim(k."Central Assign Name"), ''), d."Central Assign Name"),
--     "Referee ID"          = coalesce(nullif(btrim(k."Referee ID"), ''),          d."Referee ID"),
--     "Date of Birth"       = coalesce(nullif(btrim(k."Date of Birth"), ''),       d."Date of Birth"),
--     age                   = coalesce(k.age,                   d.age),
--     registration_year     = coalesce(k.registration_year,     d.registration_year),
--     email                 = coalesce(nullif(btrim(k.email), ''),   d.email),
--     phone                 = coalesce(nullif(btrim(k.phone), ''),   d.phone),
--     address               = coalesce(nullif(btrim(k.address), ''), d.address),
--     city                  = coalesce(nullif(btrim(k.city), ''),    d.city),
--     state                 = coalesce(nullif(btrim(k.state), ''),   d.state),
--     "Zip Code"            = coalesce(nullif(btrim(k."Zip Code"), ''), d."Zip Code"),
--     "Guardian Name"       = coalesce(nullif(btrim(k."Guardian Name"), ''),  d."Guardian Name"),
--     "Guardian Email"      = coalesce(nullif(btrim(k."Guardian Email"), ''), d."Guardian Email"),
--     "Guardian Phone"      = coalesce(nullif(btrim(k."Guardian Phone"), ''), d."Guardian Phone"),
--     "Years Reffing"       = coalesce(nullif(btrim(k."Years Reffing"), ''),  d."Years Reffing"),
--     "Certification Level" = coalesce(nullif(btrim(k."Certification Level"), ''), d."Certification Level"),
--     venmo                 = coalesce(nullif(btrim(k.venmo), ''),   d.venmo),
--     payment_method        = coalesce(nullif(btrim(k.payment_method), ''), d.payment_method),
--     -- ⚠️ A SECOND EMAIL IS NOT A SPARE FIELD. If the retired row's address
--     -- differs, keep it — that inbox is how he was reached before, and losing
--     -- it is how someone stops getting assignment mail without anyone noticing.
--     "Email 2"             = coalesce(nullif(btrim(k."Email 2"), ''),
--                                      CASE WHEN lower(btrim(d.email)) IS DISTINCT FROM lower(btrim(k.email))
--                                           THEN d.email END)
-- FROM referees d
-- WHERE k.id = <KEEP> AND d.id = <DROP>;
--
-- -- C. ⭐ KEEP THE OLD NAME AS AN ALIAS. A CA import that still says
-- -- "Cole Gran" can then match this record instead of making a third one.
-- UPDATE referees SET
--     aliases = btrim(both ',' FROM
--                 coalesce(nullif(btrim(aliases), '') || ',', '') || 'Cole Gran')
-- WHERE id = <KEEP>
--   AND coalesce(aliases, '') NOT ILIKE '%Cole Gran%';
--
-- -- D. The games. These store the NAME, so they are rewritten by hand.
-- UPDATE games SET "Center Referee" = 'Nicholas Gran'
--  WHERE "Center Referee" IN ('Cole Gran', 'Nicholas Gran');
-- UPDATE games SET "AR 1" = 'Nicholas Gran'
--  WHERE "AR 1" IN ('Cole Gran', 'Nicholas Gran');
-- UPDATE games SET "AR 2" = 'Nicholas Gran'
--  WHERE "AR 2" IN ('Cole Gran', 'Nicholas Gran');
--
-- -- E. The denormalised name copies elsewhere.
-- UPDATE availability SET
--     "Name"         = CASE WHEN "Name"         ILIKE '%Gran%' THEN 'Nicholas Gran' ELSE "Name" END,
--     "Referee Name" = CASE WHEN "Referee Name" ILIKE '%Gran%' THEN 'Nicholas Gran' ELSE "Referee Name" END,
--     referee        = CASE WHEN referee        ILIKE '%Gran%' THEN 'Nicholas Gran' ELSE referee END
--  WHERE referee_id = <KEEP>;
-- UPDATE game_incidents SET referee_name = 'Nicholas Gran' WHERE referee_id = <KEEP>;
--
-- -- F. The name on the surviving record.
-- UPDATE referees SET name = 'Nicholas Gran' WHERE id = <KEEP>;
--
-- -- G. Only now is the other row free to go.
-- DELETE FROM referees WHERE id = <DROP>;
--
-- -- Check before committing:
-- --   SELECT id, name, aliases, "Central Assign ID", email, "Date of Birth"
-- --     FROM referees WHERE id IN (<KEEP>, <DROP>);
-- --   -- and re-run 1c: every slot should now read 'Nicholas Gran'
-- -- Happy?  COMMIT;   Not happy?  ROLLBACK;
-- COMMIT;


-- ── AFTER ───────────────────────────────────────────────────────────────────
-- ⚠️ If the two rows had DIFFERENT "Central Assign ID"s, this fixes Referee
-- Tool only. Central Assign still holds two referees and the next roster
-- import recreates the duplicate — match on CA ID first when importing.
