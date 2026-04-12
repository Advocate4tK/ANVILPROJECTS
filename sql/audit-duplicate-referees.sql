-- Duplicate Referee Audit
-- Run in Supabase SQL Editor to surface likely duplicate records
-- Results: same phone, same email, or same last name + first 3 chars of first name
-- Family members sharing a phone will appear here -- review manually before merging

SELECT phone, COUNT(*) as cnt, array_agg(id) as ids, array_agg(name) as names
FROM referees
WHERE phone IS NOT NULL AND phone != ''
GROUP BY phone
HAVING COUNT(*) > 1

UNION ALL

SELECT email, COUNT(*) as cnt, array_agg(id) as ids, array_agg(name) as names
FROM referees
WHERE email IS NOT NULL AND email != ''
GROUP BY email
HAVING COUNT(*) > 1

UNION ALL

SELECT split_part(name, ' ', 2) || ' / ' || LEFT(split_part(name, ' ', 1), 3) as match_key,
    COUNT(*) as cnt,
    array_agg(id) as ids,
    array_agg(name) as names
FROM referees
WHERE name IS NOT NULL AND name != ''
GROUP BY split_part(name, ' ', 2), LEFT(split_part(name, ' ', 1), 3)
HAVING COUNT(*) > 1

ORDER BY cnt DESC;
