-- Billing & Contracts tables
-- Run in DBeaver
-- Created: 2026-06-03

-- Club contracts: one per club per season
CREATE TABLE IF NOT EXISTS club_contracts (
    id                    serial PRIMARY KEY,
    club_id               integer REFERENCES clubs(id) ON DELETE CASCADE,
    season                text NOT NULL,
    billing_model         text NOT NULL DEFAULT 'per_team',  -- per_team | per_game | flat
    rate_tiers            jsonb NOT NULL DEFAULT '[]',       -- [{age_group, rate}]
    billing_contact_name  text,
    billing_contact_email text,
    billing_address       text,
    payment_terms         text NOT NULL DEFAULT 'Net 15 Days',  -- Net 15 Days | Net 30 Days | Due on Receipt
    contract_type         text NOT NULL DEFAULT 'standard',  -- standard | custom
    notes                 text,
    signed_by_name        text,
    contract_signed_at    timestamptz,
    created_at            timestamptz DEFAULT now(),
    UNIQUE (club_id, season)
);

-- Invoices: one per club per season
CREATE TABLE IF NOT EXISTS invoices (
    id             serial PRIMARY KEY,
    club_id        integer REFERENCES clubs(id) ON DELETE CASCADE,
    contract_id    integer REFERENCES club_contracts(id) ON DELETE SET NULL,
    season         text NOT NULL,
    invoice_number text,
    line_items     jsonb NOT NULL DEFAULT '[]',  -- [{qty, description, unit_price, total}]
    subtotal       numeric(10,2) DEFAULT 0,
    total_due      numeric(10,2) DEFAULT 0,
    comments       text,
    status         text NOT NULL DEFAULT 'draft',  -- draft | sent | paid
    sent_at        timestamptz,
    paid_at        timestamptz,
    created_at     timestamptz DEFAULT now(),
    UNIQUE (club_id, season)
);
