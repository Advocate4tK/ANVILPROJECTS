-- ============================================================
-- SET CENTRAL ASSIGN VENUE IDs
-- Source: CA screenshots (E Haddam, GRISWOLD, Eric1-4)
-- Run this in Supabase SQL Editor (kaniccdqieyesezpousu)
-- ============================================================
-- Strategy: match on ILIKE so minor spelling diffs still hit.
-- After running, check count of rows updated vs total venues.
-- ============================================================

UPDATE venues SET "Venue ID" = 504  WHERE "Venue Name" ILIKE '%Nathan Hale Middle%' AND "Venue Name" NOT ILIKE '%Ray%';
UPDATE venues SET "Venue ID" = 867  WHERE "Venue Name" ILIKE '%Nathan Hale%Ray%' OR "Venue Name" ILIKE '%Hale-Ray%' OR "Venue Name" ILIKE '%Hale Ray%';
UPDATE venues SET "Venue ID" = 845  WHERE "Venue Name" ILIKE '%Blackwell%' AND "Venue Name" ILIKE '%Canterbury%';
UPDATE venues SET "Venue ID" = 967  WHERE "Venue Name" ILIKE '%Griswold High%';
UPDATE venues SET "Venue ID" = 917  WHERE "Venue Name" ILIKE '%Griswold%Soccer%' OR "Venue Name" ILIKE '%Griswold%Complex%';
UPDATE venues SET "Venue ID" = 510  WHERE "Venue Name" ILIKE '%Griswold%Garage%' OR "Venue Name" ILIKE '%Town Garage%';
UPDATE venues SET "Venue ID" = 899  WHERE "Venue Name" ILIKE '%Manship%';
UPDATE venues SET "Venue ID" = 123  WHERE "Venue Name" ILIKE '%Addison Park%';
UPDATE venues SET "Venue ID" = 549  WHERE "Venue Name" ILIKE '%Bartlem%';
UPDATE venues SET "Venue ID" = 648  WHERE "Venue Name" ILIKE '%Blackledge%';
UPDATE venues SET "Venue ID" = 1017 WHERE "Venue Name" ILIKE '%Buckingham%';
UPDATE venues SET "Venue ID" = 577  WHERE "Venue Name" ILIKE '%Burnt Hill%';
UPDATE venues SET "Venue ID" = 891  WHERE "Venue Name" ILIKE '%Caulkins%';
UPDATE venues SET "Venue ID" = 264  WHERE "Venue Name" ILIKE '%Cheshire Academy%';
UPDATE venues SET "Venue ID" = 987  WHERE "Venue Name" ILIKE '%Cheshire%HS%' OR "Venue Name" ILIKE '%Cheshire High%';
UPDATE venues SET "Venue ID" = 477  WHERE "Venue Name" ILIKE '%Country Club%MYS%' OR "Venue Name" ILIKE '%MYS Soccer%';
UPDATE venues SET "Venue ID" = 104  WHERE "Venue Name" ILIKE '%Coventry%HS%' OR "Venue Name" ILIKE '%Coventry High%';
UPDATE venues SET "Venue ID" = 570  WHERE "Venue Name" ILIKE '%Cross Farms%';
UPDATE venues SET "Venue ID" = 755  WHERE "Venue Name" ILIKE '%Sportsplex%' OR "Venue Name" ILIKE '%CT Sportsplex%';
UPDATE venues SET "Venue ID" = 572  WHERE "Venue Name" ILIKE '%Farley%';
UPDATE venues SET "Venue ID" = 689  WHERE "Venue Name" ILIKE '%Robertson%';
UPDATE venues SET "Venue ID" = 567  WHERE "Venue Name" ILIKE '%Glastonbury High%';
UPDATE venues SET "Venue ID" = 645  WHERE "Venue Name" ILIKE '%Hebron Avenue%';
UPDATE venues SET "Venue ID" = 569  WHERE "Venue Name" ILIKE '%Heron Cove%';
UPDATE venues SET "Venue ID" = 314  WHERE "Venue Name" ILIKE '%Irish American%';
UPDATE venues SET "Venue ID" = 1083 WHERE "Venue Name" ILIKE '%Knox Lane%' OR "Venue Name" ILIKE '%Knox%' AND "Venue Name" ILIKE '%Glastonbury%';
UPDATE venues SET "Venue ID" = 366  WHERE "Venue Name" ILIKE '%Lebanon Elementary%';
UPDATE venues SET "Venue ID" = 367  WHERE "Venue Name" ILIKE '%Lebanon Middle%';
UPDATE venues SET "Venue ID" = 1039 WHERE "Venue Name" ILIKE '%Ledyard High%' OR "Venue Name" ILIKE '%Ledyard%HS%';
UPDATE venues SET "Venue ID" = 395  WHERE "Venue Name" ILIKE '%Lions Club%' AND "Venue Name" ILIKE '%Mansfield%';
UPDATE venues SET "Venue ID" = 1046 WHERE "Venue Name" ILIKE '%Lions Fairground%';
UPDATE venues SET "Venue ID" = 952  WHERE "Venue Name" ILIKE '%Long Hill%';
UPDATE venues SET "Venue ID" = 459  WHERE "Venue Name" ILIKE '%Loomis%';
UPDATE venues SET "Venue ID" = 368  WHERE "Venue Name" ILIKE '%Lyman Memorial%';
UPDATE venues SET "Venue ID" = 923  WHERE "Venue Name" ILIKE '%Magnet School%';
UPDATE venues SET "Venue ID" = 1036 WHERE "Venue Name" ILIKE '%Maloney%';
UPDATE venues SET "Venue ID" = 400  WHERE "Venue Name" ILIKE '%Mansfield Middle%';
UPDATE venues SET "Venue ID" = 1158 WHERE "Venue Name" ILIKE '%Miller Richardson%';
UPDATE venues SET "Venue ID" = 1128 WHERE "Venue Name" ILIKE '%Municipal Field%';
UPDATE venues SET "Venue ID" = 417  WHERE "Venue Name" ILIKE '%Nayaug%';
UPDATE venues SET "Venue ID" = 603  WHERE "Venue Name" ILIKE '%New London%HS%' OR "Venue Name" ILIKE '%New London High%';
UPDATE venues SET "Venue ID" = 460  WHERE "Venue Name" ILIKE '%Oakwood%';
UPDATE venues SET "Venue ID" = 625  WHERE "Venue Name" ILIKE '%Portland Recreational%' OR "Venue Name" ILIKE '%Portland Rec%';
UPDATE venues SET "Venue ID" = 97   WHERE "Venue Name" ILIKE '%Quinnipiac%';
UPDATE venues SET "Venue ID" = 396  WHERE "Venue Name" ILIKE '%River Rd%' OR "Venue Name" ILIKE '%River Road Athletic%';
UPDATE venues SET "Venue ID" = 506  WHERE "Venue Name" ILIKE '%Riverfront%';
UPDATE venues SET "Venue ID" = 1149 WHERE "Venue Name" ILIKE '%Rotary%Glastonbury%' OR "Venue Name" ILIKE '%Glastonbury Rotary%';
UPDATE venues SET "Venue ID" = 1021 WHERE "Venue Name" ILIKE '%Smith Middle%';
UPDATE venues SET "Venue ID" = 81   WHERE "Venue Name" ILIKE '%Spera%';
UPDATE venues SET "Venue ID" = 854  WHERE "Venue Name" ILIKE '%St Bernard%' OR "Venue Name" ILIKE '%Saint Bernard%';
UPDATE venues SET "Venue ID" = 865  WHERE "Venue Name" ILIKE '%Star Hill%';
UPDATE venues SET "Venue ID" = 819  WHERE "Venue Name" ILIKE '%Stonington High%';
UPDATE venues SET "Venue ID" = 882  WHERE "Venue Name" ILIKE '%Stonington Middle%';
UPDATE venues SET "Venue ID" = 933  WHERE "Venue Name" ILIKE '%Taugwonk%';
UPDATE venues SET "Venue ID" = 1143 WHERE "Venue Name" ILIKE '%The Forge%';
UPDATE venues SET "Venue ID" = 1136 WHERE "Venue Name" ILIKE '%Williams School%';
UPDATE venues SET "Venue ID" = 763  WHERE "Venue Name" ILIKE '%Tolland%HS%' OR "Venue Name" ILIKE '%Tolland High%';
UPDATE venues SET "Venue ID" = 1077 WHERE "Venue Name" ILIKE '%Vale Sports%';
UPDATE venues SET "Venue ID" = 386  WHERE "Venue Name" ILIKE '%Valley Regional%';
UPDATE venues SET "Venue ID" = 576  WHERE "Venue Name" ILIKE '%Veteran%Park%' OR "Venue Name" ILIKE '%Veterans Park%' OR "Venue Name" ILIKE '%Vet%Park%Hebron%';
UPDATE venues SET "Venue ID" = 1047 WHERE "Venue Name" ILIKE '%West Road%';
UPDATE venues SET "Venue ID" = 810  WHERE "Venue Name" ILIKE '%Williams Athletic%';
UPDATE venues SET "Venue ID" = 963  WHERE "Venue Name" ILIKE '%Windham%';
UPDATE venues SET "Venue ID" = 984  WHERE "Venue Name" ILIKE '%Xavier%';

-- ── Verify ─────────────────────────────────────────────────────────────────
-- Run this SELECT after to see what got set vs what's still missing
SELECT "Venue Name", "Venue ID", club_name
FROM venues
ORDER BY "Venue Name";
