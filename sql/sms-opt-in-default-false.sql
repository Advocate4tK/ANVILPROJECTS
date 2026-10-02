-- ============================================================================
-- referees.sms_opt_in — stop the column default opting people in
-- 2026-10-02
--
-- Found by accident. Inserting Alexander Kubrynski (13, Central Assign #41448)
-- without naming sms_opt_in produced a row with sms_opt_in = TRUE, and he was
-- the ONLY referee on a 3,460-row roster with that value. Every other import
-- had set it explicitly, so the default had never been exercised.
--
-- 2,240 of the 3,460 referees are minors. A column that silently opts a
-- thirteen-year-old into text messages is not a default anyone chose; it is one
-- nobody noticed. The value should come from the availability form, where the
-- referee — or their guardian — actually answers the question.
--
-- ⚠️ THIS CHANGES THE DEFAULT ONLY. It does not touch a single existing row.
-- Nobody who has opted in loses anything, because right now nobody has: the
-- verification at the bottom should return 0 before and after.
--
-- Tod's position on consent, 2026-10-02: "we are not going to wait for consent."
-- That is about not BLOCKING on it — it is not an instruction to let a column
-- default make the decision silently. Set it deliberately or leave it false.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================

ALTER TABLE referees ALTER COLUMN sms_opt_in SET DEFAULT false;

COMMENT ON COLUMN referees.sms_opt_in IS
    'Whether this referee accepts SMS. Defaults FALSE on purpose — 2,240 of the roster are minors and an opt-in must be an answer, not a default. Set from the availability form, or deliberately by an assignor. See also sms_consent_at and guardian_sms_consent_at, which record WHEN consent was given.';


-- VERIFY ---------------------------------------------------------------------

-- 1. The default is now false.
SELECT column_name, column_default
FROM   information_schema.columns
WHERE  table_name = 'referees' AND column_name = 'sms_opt_in';
--  expected: false

-- 2. Nobody was changed by this, and nobody is opted in without a consent stamp.
SELECT count(*) FILTER (WHERE sms_opt_in IS TRUE)                              AS opted_in,
       count(*) FILTER (WHERE sms_opt_in IS TRUE AND sms_consent_at IS NULL)   AS opted_in_no_consent,
       count(*) FILTER (WHERE age < 18)                                        AS minors,
       count(*)                                                                AS total
FROM   referees;
--  expected: opted_in 0, opted_in_no_consent 0, minors ~2240, total ~3460


-- ROLLBACK -------------------------------------------------------------------
-- ALTER TABLE referees ALTER COLUMN sms_opt_in SET DEFAULT true;
