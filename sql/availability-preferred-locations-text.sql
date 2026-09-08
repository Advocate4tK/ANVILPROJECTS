-- ============================================================================
-- Availability form: "Preferred Locations" overflows varchar(50)
-- 2026-09-08
--
-- SYMPTOM (reported by referee Adrien Lavertue, iPhone, from the live form):
--     "Failed to submit form: value too long for type character varying(50).
--      Please try again or contact your assignor."
--
-- CAUSE: js/form-handler.js writes the club checkboxes as a joined string:
--            'Preferred Locations': locations.join(', ')
--        Adrien ticked five clubs:
--            East Haddam, Glastonbury, Griswold, Lebanon, RHAMYS
--        = 51 characters. The column is varchar(50). One over.
--
-- ⚠️ THIS IS NOT AN EDGE CASE. There are SIX clubs on the availability form
--    today; ticking all of them joins to NINETY-FOUR characters. And
--    "Canterbury Athletic Association" is 31 on its own, so that club plus two
--    others already overflows. Every referee who works for several clubs will
--    hit this. The longest value ever successfully stored is 46 - we have been
--    sitting just under the ceiling this whole time.
--
-- WHY A SCHEMA CHANGE MID-SEASON IS OK HERE (the standing rule says avoid it):
--   * varchar(50) -> text is a WIDENING. No data is lost, nothing that reads
--     the column changes, PostgREST is unaffected.
--   * Postgres does NOT rewrite the table for varchar -> text. It is a catalog
--     update: effectively instant, no meaningful lock on 381 rows.
--   * The rule exists because of the RLS-policy-name collision that silently
--     broke working policies. This is not that class of change.
--   * The alternative is referees unable to submit during the week assignments
--     go out.
--
-- ⚠️ EFFECTIVELY ONE-WAY. Narrowing back to varchar(50) would fail once any
--    row exceeds 50 characters.
-- ============================================================================

ALTER TABLE availability
    ALTER COLUMN "Preferred Locations" TYPE text;

-- ---------------------------------------------------------------------------
-- VERIFY - both queries should succeed after the ALTER.
-- ---------------------------------------------------------------------------

-- 1. The column should now report 'text' with no character maximum.
SELECT column_name, data_type, character_maximum_length
FROM   information_schema.columns
WHERE  table_name  = 'availability'
  AND  column_name = 'Preferred Locations';
--  expected:  Preferred Locations | text | NULL

-- 2. Round-trip a value longer than the old ceiling, then remove it.
--    94 characters - the worst case if a referee ticks every club on the form.
INSERT INTO availability ("Referee Name", "Referee Email", date, "Preferred Locations", status)
VALUES ('ZZ Width Test', 'width-test@example.invalid', CURRENT_DATE,
        'Canterbury Athletic Association, East Haddam, Glastonbury, Griswold, Lebanon, RHAMYS',
        'New');

SELECT length("Preferred Locations") AS stored_length
FROM   availability
WHERE  "Referee Name" = 'ZZ Width Test';
--  expected: 83 (or whatever the test string measures) - anything > 50 proves it

DELETE FROM availability WHERE "Referee Name" = 'ZZ Width Test';
--  ⚠️ DO NOT SKIP THIS DELETE. The test row must not survive into the roster.
