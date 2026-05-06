-- Recreation Portal Setup
-- Run in Supabase SQL Editor

-- 1. Add columns to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS organization text;
ALTER TABLE games ADD COLUMN IF NOT EXISTS pay_type text;
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_unsanctioned boolean DEFAULT false;

-- 2. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id          serial PRIMARY KEY,
    name        text NOT NULL,
    admin_name  text,
    address     text,
    phone       text,
    pay_type    text,
    insurance_confirmed boolean DEFAULT false,
    active      boolean DEFAULT false,
    created_at  timestamptz DEFAULT now()
);

-- 3. RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orgs_anon_select" ON organizations
    FOR SELECT TO anon USING (true);

CREATE POLICY "orgs_anon_insert" ON organizations
    FOR INSERT TO anon WITH CHECK (true);

-- 4. Insert RECREATION club row (skip if already exists)
INSERT INTO clubs (name, "Club Name", "Source Club", "Display Name")
SELECT 'RECREATION', 'RECREATION', 'RECREATION', 'Recreation'
WHERE NOT EXISTS (SELECT 1 FROM clubs WHERE name = 'RECREATION');

-- 5. Insert openings_recreation_orgs settings key (for ref-availability-tools.html)
INSERT INTO settings (key, value)
SELECT 'openings_recreation_orgs', '[]'
WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'openings_recreation_orgs');
