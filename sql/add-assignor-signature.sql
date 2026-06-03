-- Add assignor signature fields to club_contracts
-- Run each separately in DBeaver

ALTER TABLE public.club_contracts ADD COLUMN IF NOT EXISTS assignor_signed_by text;
ALTER TABLE public.club_contracts ADD COLUMN IF NOT EXISTS assignor_signed_at timestamptz;
