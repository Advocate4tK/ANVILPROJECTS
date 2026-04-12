-- Add Venmo and payment method columns to referees table
-- Run in Supabase SQL Editor before importing Griswold refs

ALTER TABLE referees ADD COLUMN IF NOT EXISTS venmo text;
ALTER TABLE referees ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'venmo';
ALTER TABLE referees ADD COLUMN IF NOT EXISTS "Guardian Phone" text;
