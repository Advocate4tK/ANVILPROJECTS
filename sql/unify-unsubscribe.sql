-- ============================================================================
-- One answer to "has this person opted out?"
-- 2026-10-12
--
-- Tod unsubscribed himself tonight to test the link, and found his own row on
-- referee-blasts.html still reading "All email" — while sitting in the OPTED
-- OUT panel directly above it.
--
-- Both were telling the truth about different columns:
--
--   unsubscribe.html  → unsubscribe_by_token() → sets email_opt_in = false
--   every screen      → reads email_pref
--   optedOut()        → reads BOTH, which is why the send is correctly blocked
--
-- So an unsubscribed referee is properly excluded from blasts and then shows
-- as perfectly mailable on their card. Three of the four people in that panel
-- read "all" — Albano Teixeira, Patrick Teevan and Tod. The fourth, Mark
-- Dwumfour, reads correctly only because somebody fixed him by hand.
--
-- ⚠️ THIS IS A DATA FIX, NOT A CODE ONE. Referee Management, the card on
-- referee-blasts, and the Opt-outs panel all read email_pref — so setting it
-- correctly makes all three right at once, and the workstation starts badging
-- them ✉ OFF into the bargain. Nothing in JavaScript has to change.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================

-- BEFORE ---------------------------------------------------------------------
-- Everyone the sender treats as opted out, and what their card claims.
SELECT id, name, email, email_opt_in, email_pref, email_pref_note, email_pref_at
FROM   referees
WHERE  email_opt_in = false
   OR (email_pref IS NOT NULL AND email_pref <> 'all')
ORDER  BY name;


-- BACKFILL -------------------------------------------------------------------
-- Anyone the unsubscribe link switched off, whose card still says "all".
--
-- ⚠️ 'assignments', NOT 'none'. I had this the wrong way round first and Mark
-- Dwumfour is the proof — whoever fixed him by hand read the page properly.
--
-- The unsubscribe page promises, in as many words:
--
--     "You'll no longer get blasts about openings, schedules, or
--      announcements from Referee Tool assignors.
--      This does not affect game assignments or your registration —
--      only the group emails."
--
-- That is the definition of 'assignments only'. Setting 'none' would stop the
-- assignment notices these people were explicitly told they would keep getting,
-- and would make the workstation warn before giving them a game. Both wrong.
--
-- For blasts it makes no difference — optedOut() excludes 'none' and
-- 'assignments' alike, so all four are already blocked from the sender. The
-- difference is everything else: game notices, and the ✉ OFF badge.
--
-- ⚠️ email_pref_at is NOT set to now(). We do not know when they clicked, and
-- stamping tonight's date would claim a fact we do not have. The note says
-- where it came from instead.
UPDATE referees
SET    email_pref      = 'assignments',
       email_pref_note = coalesce(nullif(btrim(email_pref_note), ''),
                                  'Clicked unsubscribe in a blast footer'),
       email_pref_by   = coalesce(email_pref_by, 'unsubscribe link')
WHERE  email_opt_in = false
  AND  coalesce(email_pref, 'all') = 'all';


-- VERIFY ---------------------------------------------------------------------
SELECT id, name, email, email_opt_in, email_pref, email_pref_note, email_pref_by
FROM   referees
WHERE  email_opt_in = false
   OR (email_pref IS NOT NULL AND email_pref <> 'all')
ORDER  BY name;

-- Should be zero: nobody switched off by the link while their card says "all".
SELECT count(*) AS still_disagreeing
FROM   referees
WHERE  email_opt_in = false
  AND  coalesce(email_pref, 'all') = 'all';


-- ============================================================================
-- STILL TO DO — THE FORWARD HALF
--
-- The backfill fixes everyone who has already unsubscribed. The NEXT person to
-- click the link will set email_opt_in alone and the disagreement starts over,
-- because unsubscribe_by_token() only knows about the boolean.
--
-- It needs to set email_pref = 'assignments' as well — matching what the page
-- promises the person clicking it, not the harder stop. ⚠️ Do not let Ralph write that
-- replacement blind: it is SECURITY DEFINER, and a CREATE OR REPLACE with a
-- different argument type makes a second overloaded function rather than
-- replacing the first — which would leave the old one still being called.
--
-- Run this and give him the output:
-- ============================================================================

SELECT p.oid::regprocedure AS signature,
       p.prosecdef         AS security_definer,
       p.prosrc            AS source
FROM   pg_proc p
JOIN   pg_namespace n ON n.oid = p.pronamespace
WHERE  p.proname = 'unsubscribe_by_token';


-- ROLLBACK -------------------------------------------------------------------
-- UPDATE referees SET email_pref = 'all', email_pref_note = NULL, email_pref_by = NULL
-- WHERE  email_opt_in = false AND email_pref = 'assignments'
--   AND  email_pref_by = 'unsubscribe link';
