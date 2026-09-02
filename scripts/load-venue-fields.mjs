// Load the fields CA holds and we do not, for venues verified one by one
// against the CA venue directory (2026-09-02).
//
//   node scripts/load-venue-fields.mjs           preview, writes nothing
//   node scripts/load-venue-fields.mjs --write   commit
//
// ⛔ Only venues CONFIRMED in the CA directory are here. A zero field count is
// normal and is NOT grounds for inclusion — see the venues-without-fields note.
//
// rt_code: trg_fields_rt_code may or may not be installed. Insert without a
// code, then mint any row that comes back null, one PATCH at a time so each
// gets its own number. Works whether or not the trigger exists.

const KEY = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';
const URL = 'https://kaniccdqieyesezpousu.supabase.co';
const H   = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const WRITE = process.argv.includes('--write');

// venueId = our venues.id · caVenue = CA Venue ID · fields [CA Field ID, name]
// A null CA Field ID means CA has no such field. Never invent one.
const PLAN = [
    { rt: 'RTVCT017', name: 'Bentley Complex', venueId: 215, caVenue: 795,
      note: 'CA lists 2; Tod referees here — two grass and one turf. Grass 2 has no CA field.',
      fields: [[775, 'Grass 1'], [null, 'Grass 2'], [776, 'Turf']] },

    { rt: 'RTVCT019', name: 'Bull Hill Park', venueId: 217, caVenue: 560, fixCaFrom: 360,
      note: 'CA id was stored as 360; directory says 560 (No. Grosvenordale).',
      fields: [[811, 'Field #1'], [812, 'Field #2'], [813, 'Field #3']] },

    { rt: 'RTVCT049', name: 'Bartlem Park', venueId: 156, caVenue: 549,
      fields: [[1591, 'M2 11v11'], [1592, 'M3 11v11'], [1593, 'M6 9v9'],
               [1594, 'M7 9v9'], [1535, 'Multi-Purpose Grass'], [1534, 'Turf']] },

    { rt: 'RTVCT052', name: 'Cheshire Academy', venueId: 240, caVenue: 264,
      fields: [[1584, 'Field 1 (Track)'], [1585, 'Field 2 (Back)']] },

    { rt: 'RTVCT053', name: 'Cheshire High School', venueId: 161, caVenue: 987,
      fields: [[1748, 'Stadium']] },
];

const get = async p => {
    const r = await fetch(URL + '/rest/v1/' + p, { headers: H });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    return j;
};

async function nextCode() {
    const rows = await get('fields?select=rt_code&rt_code=like.RTFCT*&order=rt_code.desc&limit=1');
    const n = rows.length ? parseInt(String(rows[0].rt_code).slice(5), 10) : 0;
    return n + 1;
}

(async () => {
    console.log(WRITE ? 'WRITING\n' : 'PREVIEW — nothing will be saved. Re-run with --write.\n');

    let inserted = 0, skipped = 0, fixed = 0;

    for (const v of PLAN) {
        const [venue] = await get(`venues?select=id,rt_code,"Venue Name","Venue ID",city&id=eq.${v.venueId}`);
        if (!venue) { console.log(`   ✗ ${v.rt} — venues.id ${v.venueId} not found`); continue; }
        if (venue.rt_code !== v.rt) {
            console.log(`   ✗ ${v.rt} — id ${v.venueId} is ${venue.rt_code} (${venue['Venue Name']}). SKIPPED.`);
            continue;
        }

        console.log(`${v.rt}  ${venue['Venue Name']}  (${venue.city || '—'})`);
        if (v.note) console.log(`   ${v.note}`);

        // CA id correction, guarded on the wrong value being present.
        if (v.fixCaFrom != null && Number(venue['Venue ID']) === v.fixCaFrom) {
            console.log(`   CA venue id  ${v.fixCaFrom} -> ${v.caVenue}`);
            if (WRITE) {
                const r = await fetch(`${URL}/rest/v1/venues?id=eq.${v.venueId}&"Venue ID"=eq.${v.fixCaFrom}`,
                    { method: 'PATCH', headers: H, body: JSON.stringify({ 'Venue ID': v.caVenue }) });
                if (!r.ok) { console.log('   ✗ CA id update failed: ' + await r.text()); continue; }
            }
            fixed++;
        }

        const have = await get(`fields?select=id,"Field Name","Field ID"&venue_id=eq.${v.venueId}`);
        const haveNames = new Set(have.map(f => String(f['Field Name']).toLowerCase()));

        for (const [caField, name] of v.fields) {
            if (haveNames.has(name.toLowerCase())) {
                console.log(`   = ${name}  already present`);
                skipped++;
                continue;
            }
            console.log(`   + ${name.padEnd(22)} CA field ${caField ?? '(none — CA has no such field)'}`);
            if (WRITE) {
                const body = { venue_id: v.venueId, 'Venue ID': v.caVenue,
                               'Field ID': caField, 'Field Name': name, state: 'CT' };
                const r = await fetch(URL + '/rest/v1/fields', {
                    method: 'POST', headers: { ...H, Prefer: 'return=representation' },
                    body: JSON.stringify(body) });
                if (!r.ok) { console.log('     ✗ insert failed: ' + await r.text()); continue; }
            }
            inserted++;
        }
        console.log('');
    }

    // Mint codes for anything the trigger did not.
    if (WRITE) {
        const missing = await get('fields?select=id,"Field Name",venue_id&rt_code=is.null&order=id');
        if (missing.length) {
            let n = await nextCode();
            console.log(`minting rt_code for ${missing.length} row${missing.length === 1 ? '' : 's'} the trigger did not:`);
            for (const f of missing) {
                const code = 'RTFCT' + String(n++).padStart(3, '0');
                const r = await fetch(`${URL}/rest/v1/fields?id=eq.${f.id}`,
                    { method: 'PATCH', headers: H, body: JSON.stringify({ rt_code: code }) });
                console.log(`   ${r.ok ? '✓' : '✗'} ${code}  ${f['Field Name']}`);
            }
        } else {
            console.log('every field has an rt_code — the trigger is installed.');
        }
    }

    console.log(`\ninserted ${inserted} · already present ${skipped} · CA ids corrected ${fixed}`);
    if (!WRITE) console.log('nothing was saved. re-run with --write');
})();
