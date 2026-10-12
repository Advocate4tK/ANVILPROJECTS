-- ============================================================================
-- Malformed email addresses on the referee roster
-- 2026-10-12
--
-- Found when a 631-address blast came back 630 sent / 1 failed:
--
--     Invalid `to` field. The email address needs to follow the
--     `email@example.com` or `Name <email@example.com>` format.
--
-- That one was Rachel Koshy's GUARDIAN — a minor whose parent has been
-- unreachable by email for as long as that address has been on file. The other
-- four never cost anything, because a blast only sends to `email` and
-- "Guardian Email", never to the second or third slots. They are the same slots
-- that filled up with duplicates last week: nobody ever looks at them.
--
-- ⚠️ ONLY STRUCTURAL FAULTS ARE HERE. A typo'd TLD is structurally valid and
-- invisible to this check — alstonoh@gmail.vom and jascowski@comcast.ner were
-- both found by eye, not by a query. Fixed 2026-10-09.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================

-- BEFORE ---------------------------------------------------------------------
SELECT id, name, email, "Email 2", "Email 3", "Guardian Email"
FROM   referees
WHERE  id IN (1453, 2445, 2484, 2510)
ORDER  BY name;


-- THE DOMAIN IS UNAMBIGUOUS — COMPLETE IT ------------------------------------

-- Rachel Koshy (2484), guardian: tina.miriam.@gmail.com
-- A dot immediately before the @. Gmail ignores dots INSIDE the local part, so
-- this is the same inbox once the stray one goes.
UPDATE referees
SET    "Guardian Email" = 'tina.miriam@gmail.com'
WHERE  id = 2484 AND "Guardian Email" = 'tina.miriam.@gmail.com';

-- Brody Harl (1453), Email 2: brodyharl@icloud  → missing .com
-- ⚠️ Guarded so we do not recreate last week's mess: if it would merely repeat
-- the primary address, clear the slot instead. The three slots exist for three
-- DIFFERENT addresses.
UPDATE referees
SET    "Email 2" = CASE WHEN lower(email) = 'brodyharl@icloud.com'
                        THEN NULL ELSE 'brodyharl@icloud.com' END
WHERE  id = 1453 AND "Email 2" = 'brodyharl@icloud';

-- Olivia Louis (2510), Email 2: oliviasimonelouis@gmail  → missing .com
UPDATE referees
SET    "Email 2" = CASE WHEN lower(email) = 'oliviasimonelouis@gmail.com'
                        THEN NULL ELSE 'oliviasimonelouis@gmail.com' END
WHERE  id = 2510 AND "Email 2" = 'oliviasimonelouis@gmail';


-- CANNOT BE GUESSED — CLEAR IT -----------------------------------------------

-- Olivia Louis (2510), Email 3: oliviasimonelouis@gmailco
-- A second truncated run at the same address she already has in Email 2.
UPDATE referees SET "Email 3" = NULL
WHERE  id = 2510 AND "Email 3" = 'oliviasimonelouis@gmailco';

-- Jolie Clavette (2445), Email 2: nursingstrong.
-- No @ at all — a fragment somebody started typing and the form saved. There is
-- nothing to complete it to, and a wrong guess is worse than an empty slot.
UPDATE referees SET "Email 2" = NULL
WHERE  id = 2445 AND "Email 2" = 'nursingstrong.';


-- VERIFY ---------------------------------------------------------------------

SELECT id, name, email, "Email 2", "Email 3", "Guardian Email"
FROM   referees
WHERE  id IN (1453, 2445, 2484, 2510)
ORDER  BY name;

-- The whole roster, re-scanned. Should come back empty.
SELECT r.id, r.name, v.slot, v.addr
FROM   referees r
CROSS JOIN LATERAL (VALUES
    ('email',          r.email),
    ('Email 2',        r."Email 2"),
    ('Email 3',        r."Email 3"),
    ('Guardian Email', r."Guardian Email")
) AS v(slot, addr)
WHERE  v.addr IS NOT NULL AND btrim(v.addr) <> ''
  AND (v.addr LIKE '%.@%'
    OR v.addr LIKE '%..%'
    OR v.addr LIKE '% %'
    OR v.addr LIKE '%@%@%'
    OR v.addr NOT LIKE '%_@_%.__%')
ORDER  BY r.name, v.slot;

-- And no slot repeating another, which is the fault we cleaned on 2026-10-09.
SELECT id, name, email, "Email 2", "Email 3"
FROM   referees
WHERE  lower("Email 2") IN (lower(email), lower("Email 3"))
   OR  lower("Email 3") IN (lower(email), lower("Email 2"))
ORDER  BY name;


-- ROLLBACK -------------------------------------------------------------------
-- UPDATE referees SET "Guardian Email" = 'tina.miriam.@gmail.com'   WHERE id = 2484;
-- UPDATE referees SET "Email 2"        = 'brodyharl@icloud'          WHERE id = 1453;
-- UPDATE referees SET "Email 2"        = 'oliviasimonelouis@gmail'   WHERE id = 2510;
-- UPDATE referees SET "Email 3"        = 'oliviasimonelouis@gmailco' WHERE id = 2510;
-- UPDATE referees SET "Email 2"        = 'nursingstrong.'            WHERE id = 2445;
