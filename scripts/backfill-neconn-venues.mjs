/**
 * backfill-neconn-venues.mjs
 * 1. Assigns Field ID to NECONN field records (9001–9008)
 * 2. Backfills Field ID on the 133 NECONN Spring 2026 rec games
 */

import { createClient } from '@supabase/supabase-js';

const db = createClient(
    'https://kaniccdqieyesezpousu.supabase.co',
    'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb'
);

// Venue ID + field name → Field ID
const FIELD_ID_MAP = {
    '9001|Field 1': 9001,
    '9001|Field 2': 9002,
    '9001|Field 3': 9003,
    '9002|Field 1': 9004,
    '9002|Field 2': 9005,
    '9003|Field 1': 9006,
    '9004|Field 1': 9007,
    '9005|Field 1': 9008,
};

// ── 1. Set Field ID on field records ─────────────────────────────────────
console.log('Setting Field IDs on NECONN field records...');
const { data: fieldRecs } = await db.from('fields').select('id, "Field Name", "Venue ID"').eq('club', 'NECONN');

for (const f of fieldRecs) {
    const key = `${f['Venue ID']}|${f['Field Name']}`;
    const fid = FIELD_ID_MAP[key];
    if (!fid) { console.warn(`  No Field ID for key "${key}"`); continue; }
    const { error } = await db.from('fields').update({ 'Field ID': fid }).eq('id', f.id);
    if (error) console.error(`  Error updating field ${f.id}:`, error.message);
    else console.log(`  ✓ ${f['Field Name']} @ Venue ${f['Venue ID']} → Field ID ${fid}`);
}

// ── 2. Backfill Field ID on games ────────────────────────────────────────
console.log('\nBackfilling Field ID on NECONN rec games...');
const { data: games } = await db
    .from('games')
    .select('id, "Venue ID", field')
    .eq('"Source Club"', 'NECONN')
    .eq('game_type', 'Rec');

let updated = 0, skipped = 0;
for (const g of games) {
    const key = `${g['Venue ID']}|${g.field}`;
    const fid = FIELD_ID_MAP[key];
    if (!fid) { skipped++; continue; }
    const { error } = await db.from('games').update({ 'Field ID': fid }).eq('id', g.id);
    if (error) console.error(`  Error game ${g.id}:`, error.message);
    else updated++;
}

console.log(`Done. Games updated: ${updated} | Skipped: ${skipped}`);
