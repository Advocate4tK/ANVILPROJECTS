-- Add payment coordinator fields to clubs table
-- Run in Supabase SQL Editor

ALTER TABLE clubs ADD COLUMN IF NOT EXISTS payment_coordinator      text;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS payment_coordinator_email text;

-- Set Jeff Green as Griswold's payment coordinator
UPDATE clubs
SET    payment_coordinator = 'Jeff Green'
WHERE  LOWER("Club Name") LIKE '%griswold%';

-- Verify
SELECT "Club Name", payment_coordinator, payment_coordinator_email
FROM   clubs
WHERE  payment_coordinator IS NOT NULL;
