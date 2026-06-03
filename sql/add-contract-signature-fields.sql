-- Add signature fields to club_contracts
-- Run each separately in DBeaver

ALTER TABLE public.club_contracts ADD COLUMN IF NOT EXISTS signed_by_title text;
ALTER TABLE public.club_contracts ADD COLUMN IF NOT EXISTS effective_date text;
