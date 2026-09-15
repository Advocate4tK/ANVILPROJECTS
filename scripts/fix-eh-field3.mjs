// Central Assign lists venue 867 (Nathan Hale-Ray Middle School, Moodus) with
// NO FIELDS — confirmed 2026-09-03 from CA's own venue directory. Our DB held
// one field there, "Main Field" / RTFCT003, carrying CA Field ID 3. CA never
// issued that number for this venue; it looks like the venue's legacy
// `Fields 2` count of "3.0" landed in the field ID.
//
// Harmless while the export sent field NAMES. Now that it sends CA NUMBERS, a
// re-export of the 13 spring games that reference it would hand CA a bare `3`
// — a real CA field number belonging to some other venue. Worst kind of wrong:
// valid, plausible, silently filed in the wrong place.
//
// CA is the system of record, so ours matches CA: the field record goes, and
// the games that pointed at it become venue-only, like East Haddam's fall games
// already are. A blank Field is CORRECT for a venue CA lists with no fields.
//
//   node scripts/fix-eh-field3.mjs            preview
//   node scripts/fix-eh-field3.mjs --write    back up, then apply

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY  = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';
const URL  = 'https://kaniccdqieyesezpousu.supabase.co';
const H    = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const WRITE     = process.argv.includes('--write');
const FIELD_ROW = 35;    // fields.id  — "Main Field", RTFCT003
const CA_FIELD  = 3;     // the bogus CA Field ID
const CA_VENUE  = 867;

const api = async (p, init) => {
    const r = await fetch(`${URL}/rest/v1/${p}`, { headers: H, ...init });
    const t = await r.text();
    if (!r.ok) throw new Error(`${p} → ${r.status} ${t}`);
    return t ? JSON.parse(t) : null;
};

const field = await api(`fields?select=*&id=eq.${FIELD_ROW}`);
const games = await api(`games?select=*&"Field ID"=eq.${CA_FIELD}&order=date`);

if (!field.length) { console.log('field row 35 is already gone — nothing to do'); process.exit(0); }

console.log(`field row  : id ${field[0].id} · ${field[0]['Field Name']} · ${field[0].rt_code} · CA #${field[0]['Field ID']} on venue ${field[0]['Venue ID']}`);
console.log(`games      : ${games.length} referencing CA Field ID ${CA_FIELD}`);
for (const g of games) {
    console.log(`  ${g.id}  ${g.date}  ${String(g['Age Group'] || '').padEnd(6)} venue ${g['Venue ID']}  field text: ${JSON.stringify(g.field)}`);
}

const offVenue = games.filter(g => Number(g['Venue ID']) !== CA_VENUE);
if (offVenue.length) {
    console.log(`\n⛔ ${offVenue.length} of those games are NOT at venue ${CA_VENUE} — stopping rather than guessing.`);
    process.exit(1);
}

if (!WRITE) { console.log('\npreview only — re-run with --write'); process.exit(0); }

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = join(HERE, `backup-eh-field3-${stamp}.json`);
writeFileSync(backup, JSON.stringify({ field: field[0], games }, null, 2));
console.log(`\nbacked up → ${backup}`);

// Games first: never orphan a reference by deleting the target ahead of it.
let cleared = 0;
for (const g of games) {
    const patch = { 'Field ID': null };
    if (g.field) patch.field = null;   // legacy field-name text, same claim
    await api(`games?id=eq.${g.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    cleared++;
}
console.log(`cleared Field ID on ${cleared} games`);

await api(`fields?id=eq.${FIELD_ROW}`, { method: 'DELETE' });
console.log(`deleted field row ${FIELD_ROW}`);

const stillField = await api(`fields?select=id&"Venue ID"=eq.${CA_VENUE}`);
const stillGames = await api(`games?select=id&"Field ID"=eq.${CA_FIELD}`);
console.log(`\nverify: fields on venue ${CA_VENUE} = ${stillField.length} (CA says 0) · games on CA field ${CA_FIELD} = ${stillGames.length} (want 0)`);
