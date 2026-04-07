/**
 * purge-dupe-tournament.mjs
 * Deletes the accidentally double-inserted tournament games.
 * Keeps the first 491 (lowest IDs), deletes everything above that.
 *
 * Run: node scripts/purge-dupe-tournament.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kaniccdqieyesezpousu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('Fetching all tournament game IDs...');
    const { data, error } = await db
        .from('tournament_games')
        .select('id')
        .order('id', { ascending: true });

    if (error) { console.error('Error:', error.message); process.exit(1); }

    console.log(`Total tournament games found: ${data.length}`);
    if (data.length <= 491) {
        console.log('No duplicates found — nothing to delete.');
        return;
    }

    const dupIds = data.slice(491).map(r => r.id);
    console.log(`Deleting ${dupIds.length} duplicates, IDs ${dupIds[0]}–${dupIds[dupIds.length - 1]}`);

    // Delete in batches of 100
    const BATCH = 100;
    let deleted = 0;
    for (let i = 0; i < dupIds.length; i += BATCH) {
        const chunk = dupIds.slice(i, i + BATCH);
        const { error: delErr } = await db.from('tournament_games').delete().in('id', chunk);
        if (delErr) {
            console.error(`Batch ${i} error:`, delErr.message);
        } else {
            deleted += chunk.length;
            process.stdout.write(`\rDeleted ${deleted}/${dupIds.length}`);
        }
    }
    console.log('\nDone.');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
