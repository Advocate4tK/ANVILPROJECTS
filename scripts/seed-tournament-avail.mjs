/**
 * seed-tournament-avail.mjs
 * Seeds fake tournament availability for ~25 referees across
 * the 3 days of the Glastonbury Spring Warmup 2025 (Apr 25-27).
 *
 * Run: node scripts/seed-tournament-avail.mjs
 */
import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

// Tournament dates
const DATES = ['2025-04-25', '2025-04-26', '2025-04-27'];
const DAY_LABELS = { '2025-04-25': 'Fri', '2025-04-26': 'Sat', '2025-04-27': 'Sun' };

// Fetch a mix of refs — active ones + others with real names
const { data: refs, error } = await db.from('referees')
    .select('id, name, "Certification Level", "Years Reffing"')
    .not('name', 'is', null)
    .order('id')
    .limit(500);

if (error) { console.error('Fetch error:', error.message); process.exit(1); }

// Pick 25 refs: prefer Active/cert'd, fill with others
const named = refs.filter(r => r.name && isNaN(r.name.trim()));
const certified = named.filter(r => r['Certification Level']);
const others = named.filter(r => !r['Certification Level']);

// Deduplicate by name to avoid seeding same person twice
const seen = new Set();
const pool = [];
for (const r of [...certified, ...others]) {
    if (!seen.has(r.name)) { seen.add(r.name); pool.push(r); }
    if (pool.length >= 25) break;
}

console.log(`\nSeeding availability for ${pool.length} refs across 3 tournament days`);
console.log('Refs selected:');
pool.forEach(r => console.log(`  ${r.id} | ${r.name} | ${r['Certification Level'] || 'no cert'}`));

// Availability patterns — realistic variety
// Each pattern: which days available, start/end time, max games, positions, age groups
const patterns = [
    { days: [0,1,2], start:'07:00', end:'20:00', maxGames:4, pos:'Center,AR', ages:'U11,U12,U13,U14' },
    { days: [0,1,2], start:'07:00', end:'20:00', maxGames:5, pos:'Center,AR', ages:'U9,U10,U11,U12' },
    { days: [1,2],   start:'07:00', end:'20:00', maxGames:4, pos:'Center',    ages:'U13,U14,U15' },
    { days: [1,2],   start:'07:00', end:'12:00', maxGames:3, pos:'AR',        ages:'U9,U10,U11' },
    { days: [0,1,2], start:'12:00', end:'20:00', maxGames:3, pos:'Center,AR', ages:'U11,U12' },
    { days: [1],     start:'07:00', end:'20:00', maxGames:4, pos:'Center',    ages:'U9,U10' },
    { days: [0,1,2], start:'07:00', end:'15:00', maxGames:3, pos:'AR',        ages:'U11,U12,U13' },
    { days: [2],     start:'07:00', end:'20:00', maxGames:5, pos:'Center,AR', ages:'U9,U10,U11,U12,U13' },
    { days: [1,2],   start:'08:00', end:'17:00', maxGames:4, pos:'Center',    ages:'U13,U14,U15' },
    { days: [0,1,2], start:'07:00', end:'20:00', maxGames:6, pos:'Center,AR', ages:'U9,U10,U11,U12,U13,U14,U15' },
    { days: [1,2],   start:'07:00', end:'20:00', maxGames:3, pos:'AR',        ages:'U11,U12,U13' },
    { days: [0,1],   start:'07:00', end:'13:00', maxGames:3, pos:'Center,AR', ages:'U9,U10' },
    { days: [1,2],   start:'10:00', end:'20:00', maxGames:4, pos:'Center',    ages:'U11,U12,U13' },
    { days: [0,1,2], start:'07:00', end:'20:00', maxGames:5, pos:'Center,AR', ages:'U9,U10,U11,U12' },
    { days: [1],     start:'12:00', end:'20:00', maxGames:3, pos:'AR',        ages:'U13,U14,U15' },
    { days: [0,1,2], start:'07:00', end:'16:00', maxGames:4, pos:'Center,AR', ages:'U11,U12' },
    { days: [2],     start:'07:00', end:'15:00', maxGames:3, pos:'Center',    ages:'U9,U10,U11' },
    { days: [1,2],   start:'07:00', end:'20:00', maxGames:5, pos:'Center,AR', ages:'U13,U14,U15' },
    { days: [0,1,2], start:'12:00', end:'20:00', maxGames:4, pos:'Center,AR', ages:'U9,U10' },
    { days: [1,2],   start:'07:00', end:'12:00', maxGames:3, pos:'AR',        ages:'U11,U12' },
    { days: [0,1,2], start:'07:00', end:'20:00', maxGames:6, pos:'Center',    ages:'U13,U14,U15' },
    { days: [1],     start:'07:00', end:'20:00', maxGames:4, pos:'Center,AR', ages:'U9,U10,U11' },
    { days: [0,1,2], start:'08:00', end:'18:00', maxGames:4, pos:'Center,AR', ages:'U11,U12,U13,U14' },
    { days: [1,2],   start:'07:00', end:'20:00', maxGames:5, pos:'Center',    ages:'U9,U10' },
    { days: [0,1,2], start:'07:00', end:'14:00', maxGames:3, pos:'AR',        ages:'U9,U10,U11,U12' },
];

// Build availability rows
const rows = [];
pool.forEach((ref, i) => {
    const pat = patterns[i % patterns.length];
    pat.days.forEach(dayIdx => {
        rows.push({
            referee_id:                 ref.id,
            date:                       DATES[dayIdx],
            available:                  true,
            'Referee Name':             ref.name,
            'Start Time':               pat.start,
            'End Time':                 pat.end,
            'Max Games':                pat.maxGames,
            'Positions Willing to Work': pat.pos,
            'Age Groups Preferred':     pat.ages,
            'Total Years Reffing':      ref['Years Reffing'] || null,
            status:                     'submitted',
        });
    });
});

console.log(`\nInserting ${rows.length} availability records...`);

// Insert in batches
const BATCH = 50;
let ok = 0, fail = 0;
for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error: insErr } = await db.from('availability').insert(chunk);
    if (insErr) { console.error(`Batch error: ${insErr.message}`); fail += chunk.length; }
    else ok += chunk.length;
}

console.log(`\nDone — ${ok} inserted, ${fail} failed`);
console.log('\nAvailability summary:');
DATES.forEach(d => {
    const count = rows.filter(r => r.date === d).length;
    console.log(`  ${DAY_LABELS[d]} ${d}: ${count} refs available`);
});
