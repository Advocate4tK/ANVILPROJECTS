/**
 * setup-neconn-club.mjs
 *
 * Creates NECONN club record, venues, and fields in Supabase.
 * Also backfills Gender on the 133 Spring 2026 rec games already imported.
 *
 * Run: node scripts/setup-neconn-club.mjs
 * Dry run: node scripts/setup-neconn-club.mjs --dry-run
 */

import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const db = createClient(
    'https://kaniccdqieyesezpousu.supabase.co',
    'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb'
);

// ── Venues ────────────────────────────────────────────────────────────────
// Using Venue IDs 9001-9005 — well above existing max (~1149)
const VENUES = [
    { venueId: 9001, name: 'Old KHS',       fields: [1, 2, 3] },
    { venueId: 9002, name: 'Prince Hill',   fields: [1, 2] },
    { venueId: 9003, name: 'Riverside Park',fields: [1] },
    { venueId: 9004, name: 'Pomfret Rec',   fields: [1] },
    { venueId: 9005, name: 'Rawson',        fields: [1] },
];

// ── Gender derivation from Age Group ─────────────────────────────────────
function genderFromAgeGroup(ageGroup) {
    const ag = (ageGroup || '').toLowerCase();
    if (ag.includes('girls')) return 'Girls';
    if (ag.includes('boys'))  return 'Boys';
    if (ag.includes('coed'))  return 'Coed';
    return '';
}

// ── Main ──────────────────────────────────────────────────────────────────

// 1. Check if NECONN club record already exists
const { data: existingClub } = await db.from('clubs').select('id').ilike('"Club Name"', 'NECONN');
if (existingClub?.length > 0) {
    console.log('NECONN club record already exists — skipping club creation');
} else {
    const venueIdStr = VENUES.map(v => `${v.venueId}.0`).join(',');
    const clubRecord = {
        'name':         'NECONN',
        'Club Name':    'NECONN',
        'Display Name': 'NECONN Soccer Club',
        'Source Club':  'NECONN',
        'venues':       venueIdStr,
    };
    console.log('Creating NECONN club record...');
    console.log('  venues string:', venueIdStr);
    if (!DRY_RUN) {
        const { error } = await db.from('clubs').insert(clubRecord);
        if (error) { console.error('Club insert error:', error.message); process.exit(1); }
        console.log('  ✓ Club created');
    } else {
        console.log('  [DRY RUN] would insert:', clubRecord);
    }
}

// 2. Create venue records
console.log('\nCreating venue records...');
const venueSupabaseIds = {}; // venueId → Supabase row id (for fields)

for (const v of VENUES) {
    const { data: existing } = await db.from('venues').select('id').eq('"Venue ID"', v.venueId);
    if (existing?.length > 0) {
        venueSupabaseIds[v.venueId] = existing[0].id;
        console.log(`  ${v.name} already exists (id=${existing[0].id})`);
        continue;
    }
    if (!DRY_RUN) {
        const { data, error } = await db.from('venues').insert({
            'Venue Name': v.name,
            'Venue ID':   v.venueId,
            'club_name':  'NECONN',
        }).select('id').single();
        if (error) { console.error(`  Venue "${v.name}" error:`, error.message); process.exit(1); }
        venueSupabaseIds[v.venueId] = data.id;
        console.log(`  ✓ ${v.name} created (id=${data.id})`);
    } else {
        console.log(`  [DRY RUN] would create venue: ${v.name} (Venue ID: ${v.venueId})`);
    }
}

// 3. Create field records
console.log('\nCreating field records...');
for (const v of VENUES) {
    for (const fieldNum of v.fields) {
        const { data: existing } = await db.from('fields')
            .select('id').eq('"Venue ID"', v.venueId).eq('"Field Name"', `Field ${fieldNum}`);
        if (existing?.length > 0) {
            console.log(`  ${v.name} Field ${fieldNum} already exists`);
            continue;
        }
        if (!DRY_RUN) {
            const { error } = await db.from('fields').insert({
                'Field Name': `Field ${fieldNum}`,
                'Venue ID':   v.venueId,
                'club':       'NECONN',
            });
            if (error) { console.error(`  Field error:`, error.message); process.exit(1); }
            console.log(`  ✓ ${v.name} Field ${fieldNum} created`);
        } else {
            console.log(`  [DRY RUN] would create: ${v.name} Field ${fieldNum}`);
        }
    }
}

// 4. Backfill Gender on the 133 imported NECONN Spring 2026 games
console.log('\nBackfilling Gender on NECONN Spring 2026 games...');
const { data: neconnGames, error: gErr } = await db
    .from('games')
    .select('id, "Age Group", "Gender"')
    .eq('"Source Club"', 'NECONN')
    .eq('game_type', 'Rec');

if (gErr) { console.error('Games fetch error:', gErr.message); process.exit(1); }
console.log(`  Found ${neconnGames.length} NECONN rec games`);

const toUpdate = neconnGames.filter(g => !g['Gender']);
console.log(`  ${toUpdate.length} missing Gender — backfilling...`);

let updated = 0;
for (const g of toUpdate) {
    const gender = genderFromAgeGroup(g['Age Group']);
    if (!gender) continue;
    if (!DRY_RUN) {
        const { error } = await db.from('games').update({ 'Gender': gender }).eq('id', g.id);
        if (error) { console.error(`  Update error for id=${g.id}:`, error.message); }
        else updated++;
    } else {
        console.log(`  [DRY RUN] id=${g.id} "${g['Age Group']}" → ${gender}`);
    }
}

if (!DRY_RUN) console.log(`  ✓ ${updated} games updated with Gender`);
console.log(DRY_RUN ? '\n-- DRY RUN -- no data written' : '\nDone.');
