-- ============================================================================
-- referees.email_pref — three settings, not a switch
-- 2026-09-24
--
-- Tod: "I had one parent asking me to remove a kid from email list... there
-- needs to be an opt out and also a manual way of me to find and 'opt out' in
-- the system myself for people who dont want to ref anymore or receive emails."
--
-- WHY NOT JUST email_opt_in
--   Because two different emails go to a referee and they are not the same
--   promise:
--     BLASTS            "we have openings this weekend" — recruitment
--     ASSIGNMENT EMAILS "you're assigned Saturday, here is the ground" /
--                       "log in to Central Assign and accept"
--   email_opt_in already stops the first. Nothing stops the second — and for
--   an ACTIVE referee that is correct: somebody who does not want recruitment
--   mail still has to be told when they are actually working, or they no-show
--   a game nobody told them about.
--
--   But a parent saying "take him off the email list" may mean everything, and
--   a referee who has stopped reffing certainly does. One flag cannot say
--   which, so it stops guessing:
--
--     all          everything (the default, and what all 3,455 are today)
--     assignments  no blasts; still told when they are given a game
--     none         nothing at all
--
-- ⚠️ 'none' IS A PROMISE THE ASSIGNOR HAS TO KEEP.
--   If the tool silently stops emailing somebody, the first anyone learns of
--   it is an empty touchline. So 'none' is marked visibly wherever that
--   referee appears and warns on assignment: from then on Tod phones them.
--
-- AUDIT: who asked, when, and who did it. A parent rings up about their child;
-- that conversation should be on the record, not in somebody's memory.
--
-- Nothing to migrate: exactly ONE referee has ever opted out. They are set to
-- 'assignments' rather than 'none' deliberately — they clicked a link in a
-- blast footer, which is a statement about blasts, and downgrading them to
-- silence could leave them unassigned-but-unaware.
-- ============================================================================

ALTER TABLE referees
    ADD COLUMN IF NOT EXISTS email_pref      text NOT NULL DEFAULT 'all',
    ADD COLUMN IF NOT EXISTS email_pref_at   timestamptz,
    ADD COLUMN IF NOT EXISTS email_pref_by   text,
    ADD COLUMN IF NOT EXISTS email_pref_note text;

ALTER TABLE referees DROP CONSTRAINT IF EXISTS referees_email_pref_check;
ALTER TABLE referees ADD  CONSTRAINT referees_email_pref_check
    CHECK (email_pref IN ('all', 'assignments', 'none'));

COMMENT ON COLUMN referees.email_pref IS
    'all = every email. assignments = no blasts, still told when given a game. none = nothing at all, so the assignor must contact them another way.';
COMMENT ON COLUMN referees.email_pref_note IS
    'Why — "mother rang 2026-09-24, no longer reffing". The conversation belongs on the record.';

-- The one person who has already unsubscribed from a blast footer.
UPDATE referees
SET    email_pref = 'assignments',
       email_pref_at = coalesce(email_pref_at, now()),
       email_pref_by = coalesce(email_pref_by, 'unsubscribe link'),
       email_pref_note = coalesce(email_pref_note, 'Clicked unsubscribe in a blast footer before email_pref existed')
WHERE  email_opt_in IS FALSE AND email_pref = 'all';

-- email_opt_in stays the blast gate and follows email_pref, so every page that
-- already reads it keeps working untouched.
CREATE OR REPLACE FUNCTION referees_sync_email_opt_in() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.email_opt_in := (NEW.email_pref = 'all');
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS referees_email_pref_sync ON referees;
CREATE TRIGGER referees_email_pref_sync
    BEFORE INSERT OR UPDATE OF email_pref ON referees
    FOR EACH ROW EXECUTE FUNCTION referees_sync_email_opt_in();

CREATE INDEX IF NOT EXISTS referees_email_pref_idx ON referees (email_pref)
    WHERE email_pref <> 'all';


-- VERIFY
SELECT email_pref, count(*) FROM referees GROUP BY email_pref ORDER BY 1;
--  expected: all 3455, assignments 1

SELECT name, email, email_pref, email_opt_in, email_pref_note
FROM   referees WHERE email_pref <> 'all';
--  the one unsubscriber, now on 'assignments' with email_opt_in false


-- ROLLBACK
-- DROP TRIGGER IF EXISTS referees_email_pref_sync ON referees;
-- DROP FUNCTION IF EXISTS referees_sync_email_opt_in();
-- ALTER TABLE referees DROP COLUMN IF EXISTS email_pref,
--     DROP COLUMN IF EXISTS email_pref_at, DROP COLUMN IF EXISTS email_pref_by,
--     DROP COLUMN IF EXISTS email_pref_note;
