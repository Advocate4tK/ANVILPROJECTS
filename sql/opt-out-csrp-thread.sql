-- ============================================================================
-- Remove everyone on the CSRP complaint thread from Referee Tool email
-- 2026-10-12
--
-- Ron Packard wrote on 2026-10-12, copying the Connecticut State Referee
-- Program office and four others, objecting to receiving an openings blast.
-- Tod's reply: "Say the word and I'll take you off myself."
--
-- This does it — and does it the way the tool already understands, so it holds
-- everywhere: email_pref = 'none' is honoured by the blast sender, shows in the
-- Opt-outs panel on referee-blasts.html, and badges the referee ✉ OFF in the
-- workstation with a warning before anyone assigns them.
--
-- ⚠️ 'none', not 'assignments'. 'assignments only' still sends them game
-- notices. These people asked not to hear from this system at all.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================

-- STEP 1 — FIND THEM ---------------------------------------------------------
-- The Gmail thread showed display names, not addresses: Ron Packard, Carmine,
-- Ruckey, Dean, Danny, Stan. Find the rows first and read them before updating
-- anything — "Dean" and "Stan" are common enough to catch the wrong person.
--
-- Anyone who actually received the blast is in blast_recipients, which is the
-- surer place to look than guessing at the roster.

SELECT r.id, r.name, r.email, r."Email 2", r."Email 3", r."Guardian Email",
       r.email_pref, r.email_pref_note
FROM   referees r
WHERE  r.name ILIKE '%packard%'
   OR  r.name ILIKE '%carmine%'
   OR  r.name ILIKE '%ruckey%'
   OR  r.name ILIKE '%dean%'
   OR  r.name ILIKE '%danny%'
   OR  r.name ILIKE '%stan%'
ORDER  BY r.name;

-- Cross-check against who the last blast actually went to. If one of them is
-- here but not above, the address is on a record under a different name.
SELECT br.email, br.status, r.id, r.name
FROM   blast_recipients br
LEFT   JOIN referees r ON lower(r.email) = lower(br.email)
                       OR lower(r."Email 2") = lower(br.email)
                       OR lower(r."Email 3") = lower(br.email)
                       OR lower(r."Guardian Email") = lower(br.email)
WHERE  br.blast_id = (SELECT max(id) FROM blast_log)
  AND (br.email ILIKE '%packard%'
    OR r.name ILIKE '%packard%'
    OR r.name ILIKE '%carmine%'
    OR r.name ILIKE '%ruckey%'
    OR r.name ILIKE '%dean%'
    OR r.name ILIKE '%danny%'
    OR r.name ILIKE '%stan%')
ORDER  BY br.email;


-- STEP 2 — OPT THEM OUT ------------------------------------------------------
-- ⚠️ READ STEP 1 FIRST, then put the real ids in here. Deliberately not
-- automatic: silently switching off everyone matching '%dean%' is how an active
-- referee stops getting their games and nobody notices until they miss one.
--
-- Uncomment and fill in:

-- UPDATE referees
-- SET    email_pref      = 'none',
--        email_pref_note = 'Asked to be removed — CSRP thread, 12 Oct 2026 (Ron Packard)',
--        email_pref_at   = now(),
--        email_pref_by   = 'Tod'
-- WHERE  id IN ( /* ids from step 1 */ );


-- STEP 3 — VERIFY ------------------------------------------------------------

-- SELECT id, name, email, email_pref, email_pref_note, email_pref_at, email_pref_by
-- FROM   referees
-- WHERE  id IN ( /* same ids */ );

-- And confirm the blast sender will now skip them. optedOut() on
-- referee-blasts.html treats 'none' AND 'assignments' as excluded, so these
-- should no longer appear in a recipient list at all.
-- SELECT count(*) AS still_mailable
-- FROM   referees
-- WHERE  id IN ( /* same ids */ )
--   AND  coalesce(email_pref, 'all') = 'all';
-- -- expect 0


-- IF SOMEONE IS NOT ON THE ROSTER AT ALL -------------------------------------
-- Ron may not be a referee Tod assigns — he may have been reached through a
-- club list or a guardian address. If step 1 finds nothing for him, the address
-- needs suppressing rather than a referee record updating, and there is no
-- suppression list in the tool today. Tell Ralph: that is a gap worth closing,
-- because "remove me" has to work for someone who was never a referee here.


-- ROLLBACK -------------------------------------------------------------------
-- UPDATE referees SET email_pref = 'all', email_pref_note = NULL,
--        email_pref_at = NULL, email_pref_by = NULL
-- WHERE  id IN ( /* same ids */ );
