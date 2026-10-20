-- ============================================================================
-- Duplicate venue names — find them before cleaning any up
-- 2026-10-20
--
-- Tod spotted "Lebanon Middle School" twice on Lebanon's questionnaire. Those
-- are two DIFFERENT rows in venues that happen to share a name — the form did
-- not duplicate anything, it drew what we hold.
--
-- ⚠️ WHY IT MATTERS BEYOND A TIDY LIST. Central Assign matches venues by NAME
-- (project_ca_import_proven: "Venue by OUR exact NAME"). Two rows with one
-- name means an export can resolve to either, games can end up split across
-- both, and the club portal shows a venue with half its fixtures missing.
--
-- ⛔ NOTHING HERE DELETES ANYTHING. Read-only on purpose — a venue with games
-- or fields hanging off it cannot be dropped without moving those first, and
-- which of the pair survives is a judgement call. Look first.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================

-- 1. EVERY duplicated name, with the ids and what hangs off each.
--    The one to keep is usually the one with fields, a CA id, or games.
SELECT lower(btrim(v."Venue Name"))                    AS name_key,
       count(*)                                        AS copies,
       string_agg(v.id::text, ', ' ORDER BY v.id)      AS venue_ids,
       string_agg(coalesce(v."Venue ID"::text, '—'), ', ' ORDER BY v.id) AS ca_ids,
       string_agg(coalesce(v.city, '—'), ', ' ORDER BY v.id)            AS towns
FROM   venues v
WHERE  btrim(coalesce(v."Venue Name", '')) <> ''
GROUP  BY lower(btrim(v."Venue Name"))
HAVING count(*) > 1
ORDER  BY count(*) DESC, name_key;


-- 2. The same duplicates, one row per record, with the evidence you need to
--    decide which copy is the real one.
WITH dupes AS (
    SELECT lower(btrim("Venue Name")) AS name_key
    FROM   venues
    WHERE  btrim(coalesce("Venue Name", '')) <> ''
    GROUP  BY 1 HAVING count(*) > 1
)
SELECT v.id,
       v."Venue Name",
       v."Venue ID"                                   AS ca_venue_id,
       v.city,
       v.address,
       (SELECT count(*) FROM fields f
         WHERE f."Venue ID" = v."Venue ID")           AS field_count,
       (SELECT count(*) FROM club_venues cv
         WHERE cv.venue_id = v.id)                    AS linked_clubs,
       (SELECT string_agg(DISTINCT c.name, ', ')
          FROM club_venues cv JOIN clubs c ON c.id = cv.club_id
         WHERE cv.venue_id = v.id)                    AS clubs
FROM   venues v
JOIN   dupes d ON d.name_key = lower(btrim(v."Venue Name"))
ORDER  BY lower(btrim(v."Venue Name")), v.id;


-- 3. ⚠️ ARE ANY GAMES POINTING AT THE DUPLICATES?
--    games has NO venue-name column — it carries "Venue ID" (real), which is
--    CENTRAL ASSIGN's id, not venues.id. So the join is on that.
--    ⭐ THIS IS THE QUESTION THAT DECIDES THE CLEANUP:
--      · both rows share one "Venue ID"  → pure redundancy, safe to collapse
--      · different "Venue ID"s           → CA has two venues too, and the games
--                                          are genuinely split between them
WITH dupes AS (
    SELECT lower(btrim("Venue Name")) AS name_key
    FROM   venues
    WHERE  btrim(coalesce("Venue Name", '')) <> ''
    GROUP  BY 1 HAVING count(*) > 1
)
SELECT v.id,
       v."Venue Name",
       v."Venue ID"                       AS ca_venue_id,
       count(g.id)                        AS games,
       min(g.date)                        AS first_game,
       max(g.date)                        AS last_game
FROM   venues v
JOIN   dupes d ON d.name_key = lower(btrim(v."Venue Name"))
LEFT   JOIN games g ON g."Venue ID" = v."Venue ID"
GROUP  BY v.id, v."Venue Name", v."Venue ID"
ORDER  BY lower(btrim(v."Venue Name")), v.id;


-- 4. Lebanon specifically — the one Tod saw.
SELECT v.id, v."Venue Name", v."Venue ID" AS ca_venue_id, v.city, v.address,
       (SELECT count(*) FROM fields f WHERE f."Venue ID" = v."Venue ID") AS field_count
FROM   venues v
JOIN   club_venues cv ON cv.venue_id = v.id
JOIN   clubs c        ON c.id = cv.club_id
WHERE  c.name ILIKE '%lebanon%'
ORDER  BY v."Venue Name", v.id;


-- ── WHEN YOU COME TO CLEAN ONE UP ───────────────────────────────────────────
-- ⛔ Do NOT just delete the spare row. In order:
--   1. Decide which id survives — the one with a CA "Venue ID", fields, and
--      the games against it.
--   2. Repoint club_venues at the survivor, then remove the duplicate link:
--        UPDATE club_venues SET venue_id = <keep> WHERE venue_id = <drop>;
--        -- then de-dupe any club that now has the survivor twice
--   3. Only then remove the empty row:
--        DELETE FROM venues WHERE id = <drop>;
-- ⚠️ games reference the venue by CENTRAL ASSIGN's "Venue ID", not by
-- venues.id and not by name. So if both rows carry the same "Venue ID" the
-- games follow automatically and only the spare row needs removing. If they
-- carry different ones, moving games means changing their "Venue ID" too.
