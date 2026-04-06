/**
 * backfill-neconn-venues.mjs
 * Sets Venue ID on the 133 NECONN Spring 2026 rec games based on
 * the venue name stored in the notes field during import.
 */

import { createClient } from '@supabase/supabase-js';

const db = createClient(
    'https://kaniccdqieyesezpousu.supabase.co',
    'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb'
);

// Normalize venue name → Venue ID (matches what we created in setup-neconn-club.mjs)
const VENUE_MAP = {
    'old khs':       9001,
    'oldkhs':        9001,
    'prince hill':   9002,
    'riverside park':9003,
    'riversidepark': 9003,
    'pomfret rec':   9004,
    'rawson':        9005,
};

// Fetch all NECONN rec games
const { data: games, error } = await db
    .from('games')
    .select('id, notes, field')
    .eq('"Source Club"', 'NECONN')
    .eq('game_type', 'Rec');

if (error) { console.error('Fetch error:', error.message); process.exit(1); }
console.log(`Found ${games.length} NECONN rec games`);

let updated = 0, skipped = 0, unknown = 0;

for (const g of games) {
    // Parse "Venue: Old KHS" from notes
    const match = (g.notes || '').match(/Venue:\s*(.+)/i);
    if (!match) { skipped++; continue; }

    const rawVenue = match[1].trim();
    const venueId  = VENUE_MAP[rawVenue.toLowerCase()];

    if (!venueId) {
        console.warn(`  Unknown venue "${rawVenue}" on game id=${g.id}`);
        unknown++;
        continue;
    }

    const { error: uErr } = await db
        .from('games')
        .update({ 'Venue ID': venueId })
        .eq('id', g.id);

    if (uErr) { console.error(`  Update error id=${g.id}:`, uErr.message); }
    else updated++;
}

console.log(`Done. Updated: ${updated} | Skipped (no notes): ${skipped} | Unknown venue: ${unknown}`);
