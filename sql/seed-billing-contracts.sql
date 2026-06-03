-- Seed billing contracts for East Haddam and Griswold
-- Run each statement separately in DBeaver
-- Season: Spring 2026

-- East Haddam Soccer Club (id=38): Per Team/Season · U8=$50 · Default=$80
INSERT INTO public.club_contracts (
    club_id, season, billing_model, rate_tiers,
    billing_contact_name, payment_terms, contract_type
) VALUES (
    38,
    'Spring 2026',
    'per_team',
    '[{"age_group": "U8", "rate": 50}, {"age_group": "default", "rate": 80}]',
    'Star Ems',
    'Net 15 Days',
    'standard'
)
ON CONFLICT (club_id, season) DO UPDATE SET
    billing_model         = EXCLUDED.billing_model,
    rate_tiers            = EXCLUDED.rate_tiers,
    billing_contact_name  = EXCLUDED.billing_contact_name,
    payment_terms         = EXCLUDED.payment_terms,
    contract_type         = EXCLUDED.contract_type;

-- Griswold Soccer Club (id=40): Per Team/Season · Default=$75
INSERT INTO public.club_contracts (
    club_id, season, billing_model, rate_tiers,
    billing_contact_name, payment_terms, contract_type
) VALUES (
    40,
    'Spring 2026',
    'per_team',
    '[{"age_group": "default", "rate": 75}]',
    'Ed Conn',
    'Net 15 Days',
    'standard'
)
ON CONFLICT (club_id, season) DO UPDATE SET
    billing_model         = EXCLUDED.billing_model,
    rate_tiers            = EXCLUDED.rate_tiers,
    billing_contact_name  = EXCLUDED.billing_contact_name,
    payment_terms         = EXCLUDED.payment_terms,
    contract_type         = EXCLUDED.contract_type;
