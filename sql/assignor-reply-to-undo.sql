-- ============================================================================
-- Undo the admin reply-to override — 2026-09-16, an hour after adding it
--
-- Tod: "the assignor Tod Smith should be nectassignor@gmail.com — admin should
--       be dedicated to refassignor398@gmail.com — Tod Smith the referee is
--       todlsmith@gmail.com."
--
-- Three identities. Pointing admin's replies at nectassignor@ blurred two of
-- them: it made admin behave like Tod-the-assignor because Tod happened to be
-- logged in as admin today. The right fix is not to redirect admin's mail; it
-- is for blasts to go out as tsmith. The column stays — it is the honest model
-- for any future assignor whose reply address differs from their login — but
-- admin's value comes off.
-- ============================================================================
UPDATE assignor_profiles SET reply_to_email = NULL WHERE username = 'admin';

SELECT username, coalesce(reply_to_email, email) AS replies_go_to
FROM   assignor_profiles ORDER BY username;
--  expected: admin → refassignor398@gmail.com, tsmith → nectassignor@gmail.com
