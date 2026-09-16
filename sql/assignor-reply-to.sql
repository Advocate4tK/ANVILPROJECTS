-- ============================================================================
-- assignor_profiles.reply_to_email — where a blast's replies land
-- 2026-09-16
--
-- Tod sent three blasts signed in as `admin`. Replies went to
-- refassignor398@gmail.com — admin's account address — when they belonged
-- at nectassignor@gmail.com, his assignor address. The sender was doing what
-- it was told (assignor_profiles.email); the assumption that the login
-- address IS the reply address was wrong. It held for Eric and David by
-- coincidence.
--
-- So: a separate column. send-blast uses reply_to_email when set and falls
-- back to email otherwise. Nobody but admin needs a value today.
-- ============================================================================

ALTER TABLE assignor_profiles
    ADD COLUMN IF NOT EXISTS reply_to_email text;

COMMENT ON COLUMN assignor_profiles.reply_to_email IS
    'Where referees'' replies to this assignor''s blasts go. NULL = use email. '
    'Exists because admin''s account address is not the address Tod wants '
    'replies at.';

UPDATE assignor_profiles
SET    reply_to_email = 'nectassignor@gmail.com'
WHERE  username = 'admin';


-- VERIFY
SELECT username, email, reply_to_email,
       coalesce(reply_to_email, email) AS replies_go_to
FROM   assignor_profiles ORDER BY username;
--  expected: admin → nectassignor@gmail.com; everyone else → their own email

-- ROLLBACK
-- ALTER TABLE assignor_profiles DROP COLUMN IF EXISTS reply_to_email;
