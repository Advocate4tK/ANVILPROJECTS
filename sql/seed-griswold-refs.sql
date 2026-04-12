-- Griswold Referee Import — Spring 2026
-- Run AFTER add-venmo-payment.sql
-- Uses INSERT WHERE NOT EXISTS to avoid duplicates
-- Then UPDATE to patch venmo/payment on existing records

-- ─────────────────────────────────────────────
-- UPDATE EXISTING RECORDS (venmo + payment method)
-- ─────────────────────────────────────────────

UPDATE referees SET venmo = '@Advocate4tk',      payment_method = 'venmo' WHERE email = 'nectassignor@gmail.com';
UPDATE referees SET venmo = '@Eric-Baughman-6',  payment_method = 'venmo' WHERE email = 'ct.ref.assignor@gmail.com';
UPDATE referees SET venmo = '@EddyCarvalho11',   payment_method = 'venmo' WHERE email = 'ejcarvalho11@gmail.com';
UPDATE referees SET venmo = '@Bryce_quinn1',     payment_method = 'venmo' WHERE email = 'forestboy12345@gmail.com';
UPDATE referees SET venmo = '@Benjamin-Brunson-1', payment_method = 'venmo' WHERE email = 'gmb10606@gmail.com';
UPDATE referees SET venmo = NULL,                payment_method = 'check'  WHERE email = 'lilyouillette@gmail.com';
UPDATE referees SET venmo = '@ilvia-costa',      payment_method = 'venmo' WHERE email = 'mikeyosu78@yahoo.com';
UPDATE referees SET venmo = '@ilvia-costa',      payment_method = 'venmo' WHERE email = 'costachase62@gmail.com';
UPDATE referees SET venmo = '@Brady-Stillwell',  payment_method = 'venmo' WHERE email = 'bradystillwell@hotmail.com';
UPDATE referees SET venmo = '@ScottButson',      payment_method = 'venmo' WHERE email = 'eliott100@sbcglobal.net';
UPDATE referees SET venmo = '@Ephraim-Butson',   payment_method = 'venmo' WHERE email = 'butsonephraim@gmail.com';
UPDATE referees SET venmo = NULL,                payment_method = 'check'  WHERE email = 'sjbf28@gmail.com';
UPDATE referees SET venmo = '@Ben-Hanssen',      payment_method = 'venmo' WHERE email = 'Bhanssen414@gmail.com';
UPDATE referees SET venmo = '@lylahc_13',        payment_method = 'venmo' WHERE email = 'lylah.connetti@gmail.com';
UPDATE referees SET venmo = '@hannahodenasmith', payment_method = 'venmo' WHERE email = 'hannahodenasmith@gmail.com';
UPDATE referees SET venmo = '@Alexander-Fritsch-1', payment_method = 'venmo' WHERE email = 'fritscaj@yahoo.com';
UPDATE referees SET venmo = '@Igor-Stanbuk',     payment_method = 'venmo' WHERE email = 'igor09sk@yahoo.com';
UPDATE referees SET venmo = '@Stephanie-Antone', payment_method = 'venmo' WHERE email = 'jonathantantone@icloud.com';
UPDATE referees SET venmo = NULL,                payment_method = 'check'  WHERE email = 'jeremy.p.sheppard@gmail.com';
UPDATE referees SET venmo = '@leahtalaga222',    payment_method = 'venmo' WHERE email = 'leahtalaga222@gmail.com';
UPDATE referees SET venmo = '@BookDragon24',     payment_method = 'venmo' WHERE email = 'kasey29tractor@gmail.com';
UPDATE referees SET venmo = '@emilytessier20',   payment_method = 'venmo' WHERE email = 'emily_tessier@icloud.com';
UPDATE referees SET venmo = NULL,                payment_method = 'check'  WHERE email = 'shurstruales@williamsschool.org';
UPDATE referees SET venmo = NULL, phone = '860-917-3388', "Email 2" = 'lbradcarl115@gmail.com' WHERE email = 'carlsonjohn@sbcglobal.net';

-- ─────────────────────────────────────────────
-- INSERT NEW REFS (only if email not already in system)
-- ─────────────────────────────────────────────

INSERT INTO referees (name, email, "Date of Birth", age, address, "Guardian Email", "Club Preference", venmo, payment_method)
SELECT * FROM (VALUES
  ('Edward Carvalho',      'ejcarvalho11@gmail.com',          '11-18-1992', NULL::float4, NULL,                                         NULL,                              'Griswold', '@EddyCarvalho11',       'venmo'),
  ('Anthony Kyle Dykes',   'kyledykes977@gmail.com',          '7-9-1976',   NULL,         NULL,                                         NULL,                              'Griswold', NULL,                    'venmo'),
  ('Bryce Quinn',          'forestboy12345@gmail.com',        NULL,         NULL,         NULL,                                         NULL,                              'Griswold', '@Bryce_quinn1',         'venmo'),
  ('Benjamin Brunson',     'gmb10606@gmail.com',              NULL,         NULL,         NULL,                                         NULL,                              'Griswold', '@Benjamin-Brunson-1',   'venmo'),
  ('Lilly Ouilette',       'lilyouillette@gmail.com',         '11-12-2010', NULL,         NULL,                                         NULL,                              'Griswold', NULL,                    'check'),
  ('Michael Costa',        'mikeyosu78@yahoo.com',            NULL,         NULL,         NULL,                                         NULL,                              'Griswold', '@ilvia-costa',          'venmo'),
  ('Chase Costa',          'costachase62@gmail.com',          NULL,         NULL,         NULL,                                         NULL,                              'Griswold', '@ilvia-costa',          'venmo'),
  ('Brady Stillwell',      'bradystillwell@hotmail.com',      '6-16-1971',  NULL,         NULL,                                         NULL,                              'Griswold', '@Brady-Stillwell',      'venmo'),
  ('Scott Butson',         'eliott100@sbcglobal.net',         NULL,         NULL,         NULL,                                         NULL,                              'Griswold', '@ScottButson',          'venmo'),
  ('Ephraim Butson',       'butsonephraim@gmail.com',         NULL,         NULL,         NULL,                                         NULL,                              'Griswold', '@Ephraim-Butson',       'venmo'),
  ('Francis Senat',        'sjbf28@gmail.com',                NULL,         NULL,         '15 Laurel Dr, Canterbury, CT 06331',         NULL,                              'Griswold', NULL,                    'check'),
  ('Ben Hanssen',          'Bhanssen414@gmail.com',           NULL,         NULL,         NULL,                                         NULL,                              'Griswold', '@Ben-Hanssen',          'venmo'),
  ('Lylah Connetti',       'lylah.connetti@gmail.com',        NULL,         NULL,         NULL,                                         NULL,                              'Griswold', '@lylahc_13',            'venmo'),
  ('Hannah Smith',         'hannahodenasmith@gmail.com',      NULL,         23,           NULL,                                         NULL,                              'Griswold', '@hannahodenasmith',     'venmo'),
  ('Alexander Fritsch',    'fritscaj@yahoo.com',              NULL,         43,           NULL,                                         NULL,                              'Griswold', '@Alexander-Fritsch-1',  'venmo'),
  ('Igor Stambuk',         'igor09sk@yahoo.com',              '9-11-1970',  55,           '161 E Main Street',                          NULL,                              'Griswold', '@Igor-Stanbuk',         'venmo'),
  ('Chris Watkins',        'watkins.christopher01@gmail.com', NULL,         NULL,         NULL,                                         NULL,                              'Griswold', NULL,                    'venmo'),
  ('Jonathan Antone',      'jonathantantone@icloud.com',      NULL,         NULL,         '18 Sanfords Bridge Rd, East Haddam CT 06423',NULL,                              'Griswold', '@Stephanie-Antone',     'venmo'),
  ('Jeremy Sheppard',      'jeremy.p.sheppard@gmail.com',     NULL,         13,           '17 Barbers Rd, Norwich, CT 06360',           NULL,                              'Griswold', NULL,                    'check'),
  ('Leah Talaga',          'leahtalaga222@gmail.com',         NULL,         13,           NULL,                                         NULL,                              'Griswold', '@leahtalaga222',         'venmo'),
  ('Kasey OBrien',         'kasey29tractor@gmail.com',        NULL,         15,           NULL,                                         NULL,                              'Griswold', '@BookDragon24',          'venmo'),
  ('Emily Tessier',        'emily_tessier@icloud.com',        NULL,         13,           NULL,                                         NULL,                              'Griswold', '@emilytessier20',        'venmo'),
  ('Tim Ems',              'tems13@gmail.com',                NULL,         NULL,         NULL,                                         NULL,                              'Griswold', NULL,                    'venmo'),
  ('Payton Balducci',      'payton.balducci@icloud.com',      '2-5-2009',   NULL,         '50 O''Connell Road, Colchester 06415',        'maria.balducci@yahoo.com',        'Griswold', NULL,                    'venmo'),
  ('Taylor Balducci',      'Taylor.balducci@icloud.com',      '2-14-2011',  NULL,         '50 O''Connell Road, Colchester 06415',        'maria.balducci@yahoo.com',        'Griswold', NULL,                    'venmo'),
  ('Jemmye Balducci',      'Jemmye.balducci@icloud.com',      '2-14-2011',  NULL,         '50 O''Connell Road, Colchester 06415',        'maria.balducci@yahoo.com',        'Griswold', NULL,                    'venmo'),
  ('Giovanni Marku',       'Gmarku28@icloud.com',             NULL,         16,           NULL,                                         'gogreenconstructionCT@gmail.com', 'Griswold', NULL,                    'venmo'),
  ('Noah Ondras',          'nondr23149@gmail.com',            '1-22-2005',  20,           NULL,                                         NULL,                              'Griswold', NULL,                    'venmo'),
  ('Gunnar Anderson',      'gunnarhans21@gmail.com',          '7-15-2009',  15,           NULL,                                         NULL,                              'Griswold', NULL,                    'venmo'),
  ('Jack Nelan',           'jacknelan@hotmail.com',           '10-31-1954', NULL,         NULL,                                         NULL,                              'Griswold', NULL,                    'venmo'),
  ('Sierra Hurst-Ruales',  'shurstruales@williamsschool.org', NULL,         NULL,         '20 Valley Street, Waterford CT 06385',        'cristinarualesct@gmail.com',      'Griswold', NULL,                    'check')
) AS v(name, email, dob, age, address, guardian_email, club_pref, venmo, payment_method)
WHERE NOT EXISTS (
  SELECT 1 FROM referees r WHERE r.email = v.email
);

-- ─────────────────────────────────────────────
-- INSERT REFS WITHOUT EMAIL (no conflict protection — run once only)
-- ─────────────────────────────────────────────

INSERT INTO referees (name, "Date of Birth", "Guardian Email", "Club Preference", venmo, payment_method)
VALUES
  ('Dylan Carvalho',   '5-16-2008', NULL,                        'Griswold', '@Dylan76',            'venmo'),
  ('Harrison Durand',  NULL,        'jmdurand77@gmail.com',      'Griswold', '@Jennifer-Durand-10', 'venmo'),
  ('Jackson Durand',   NULL,        'jmdurand77@gmail.com',      'Griswold', '@Jennifer-Durand-10', 'venmo'),
  ('Charlie Saporita', NULL,        NULL,                        'Griswold', '@John-Saporita',      'venmo'),
  ('Bennie Hannsen',   NULL,        NULL,                        'Griswold', NULL,                   'venmo'),
  ('Kaleb Espinoza',   NULL,        'angelasoulor@yahoo.com',    'Griswold', '@angsoulor',          'venmo'),
  ('Liam Forsyth',     NULL,        'taryne.forsyth@yahoo.com',  'Griswold', NULL,                   'venmo'),
  ('Jacob Carlson',    '7-8-2009',  'lbradcarl115@gmail.com',    'Griswold', NULL,                   'venmo');

-- ─────────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────────
-- @ilvia-costa = Michael Costa's wife + Chase Costa's mom — same Venmo, two refs
-- @Stephanie-Antone = Jonathan Antone's wife's Venmo
-- @Jennifer-Durand-10 = Harrison & Jackson Durand's mom
-- @John-Saporita = Charlie Saporita (different name — verify with ref)
-- @Igor-Stanbuk = Igor Stambuk (typo in Venmo — entered as-is)
-- John Carlson phone: 860-917-3388 (shared with Jacob Carlson — dad/son)
