-- ============================================================================
-- unsubscribe_by_token() writes both columns
-- 2026-10-12
--
-- The last of the three-way disagreement. The link flipped email_opt_in and
-- nothing else, so every screen — which all read email_pref — showed an
-- unsubscribed referee as perfectly mailable. Tod's own card said "All email"
-- directly above the note "Clicked unsubscribe in a blast footer".
--
-- The UI was fixed from both directions tonight (e8b9abf, 65aa4b0): the
-- controls read the boolean, and writing a preference now writes the boolean
-- too. This is the remaining half — so the LINK can't start the drift again.
--
-- ⚠️ SAME NAME, SAME ARGUMENT TYPE (uuid), SAME SECURITY DEFINER. A
-- CREATE OR REPLACE with a different argument type would create a SECOND
-- overloaded function and leave the old one still being called, with nothing
-- on screen to say so.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================

CREATE OR REPLACE FUNCTION unsubscribe_by_token(p_token uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH flipped AS (
        UPDATE referees
        SET    email_opt_in = false,
               -- ⚠️ 'assignments', NOT 'none'. The page they clicked says, in
               -- as many words: "You'll no longer get blasts about openings,
               -- schedules, or announcements. This does not affect game
               -- assignments or your registration — only the group emails."
               -- Writing 'none' would stop the assignment notices they were
               -- explicitly promised they would keep.
               --
               -- ⚠️ AND ONLY IF THEY ARE CURRENTLY ON 'all'. Somebody already
               -- set to 'none' who clicks the link must not be LOOSENED to
               -- 'assignments' — a link cannot grant someone more email than
               -- they had.
               email_pref = CASE
                                WHEN coalesce(email_pref, 'all') = 'all' THEN 'assignments'
                                ELSE email_pref
                            END,
               -- Keep an assignor's own note if there is one. "mother rang
               -- 24 Sep — no longer reffing" is worth more than a generic
               -- line, and the click is still recorded by the stamp below.
               email_pref_note = coalesce(nullif(btrim(email_pref_note), ''),
                                          'Clicked unsubscribe in a blast footer'),
               -- This time we DO know when, unlike the backfill.
               email_pref_at = now(),
               email_pref_by = 'unsubscribe link'
        WHERE  unsubscribe_token = p_token
        RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM flipped);
$$;


-- VERIFY ---------------------------------------------------------------------

-- Still one function, still SECURITY DEFINER, still taking a uuid.
-- ⚠️ If this returns TWO rows, the replace overloaded instead of replacing and
-- the old one is still live. Drop the wrong signature before going further.
SELECT p.oid::regprocedure AS signature, p.prosecdef AS security_definer
FROM   pg_proc p
WHERE  p.proname = 'unsubscribe_by_token';

-- Everyone the sender treats as opted out, and what their card says.
-- After this, a fresh unsubscribe lands as 'assignments' with tonight's date.
SELECT id, name, email, email_opt_in, email_pref, email_pref_note,
       email_pref_at, email_pref_by
FROM   referees
WHERE  email_opt_in = false
   OR (email_pref IS NOT NULL AND email_pref <> 'all')
ORDER  BY name;


-- ROLLBACK — the original, verbatim ------------------------------------------
-- CREATE OR REPLACE FUNCTION unsubscribe_by_token(p_token uuid)
-- RETURNS boolean
-- LANGUAGE sql
-- SECURITY DEFINER
-- AS $$
--     WITH flipped AS (
--         UPDATE referees
--         SET    email_opt_in = false
--         WHERE  unsubscribe_token = p_token
--         RETURNING 1
--     )
--     SELECT EXISTS (SELECT 1 FROM flipped);
-- $$;
