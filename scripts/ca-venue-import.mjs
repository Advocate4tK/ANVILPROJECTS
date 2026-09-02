// Import the Central Assign venue directory from transcribed frames.
//
//   node scripts/ca-venue-import.mjs             preview every staged page
//   node scripts/ca-venue-import.mjs --write     commit
//   node scripts/ca-venue-import.mjs 07          just page-07
//
// Staging lives in scripts/ca-venue-staging/page-NN.json, transcribed from
// Ralph EYES frames of cav3.ctreferee.net/assignor/venue-directory. Frames
// overlap by design, so the same venue appears on more than one page — CA
// Venue ID is the key and duplicates collapse.
//
// RULES
//  ⛔ Never invent a CA field number. A venue with no fields is NORMAL —
//     CA itself lists a large share that way — and is imported as a venue
//     with zero fields, not skipped and not flagged.
//  ⛔ Never overwrite rt_code, club_name, address, lat or lng. Those are ours;
//     CA has no opinion on them.
//  ⚠️ If we already hold a venue on that CA id and the NAME or CITY disagrees,
//     flag it and skip. Ours have been hand-corrected, and CA has its own
//     duplicates (Buckingham Park twice, Bentley vs Charles Bentley). A
//     disagreement is a question, not a fact to overwrite.

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE  = dirname(fileURLToPath(import.meta.url));
const STAGE = join(HERE, 'ca-venue-staging');

const KEY = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';
const URL = 'https://kaniccdqieyesezpousu.supabase.co';
const H   = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const args  = process.argv.slice(2);
const WRITE = args.includes('--write');
const only  = args.find(a => /^\d+$/.test(a));

const norm = s => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

const get = async p => {
    const r = await fetch(URL + '/rest/v1/' + p, { headers: H });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    return j;
};

async function nextNum(table, prefix) {
    const rows = await get(`${table}?select=rt_code&rt_code=like.${prefix}CT*&order=rt_code.desc&limit=1`);
    return rows.length ? parseInt(String(rows[0].rt_code).slice(5), 10) + 1 : 1;
}

(async () => {
    const files = readdirSync(STAGE).filter(f => /^page-\d+\.json$/.test(f)).sort()
        .filter(f => !only || f === `page-${only.padStart(2, '0')}.json`);
    if (!files.length) { console.error('no staged pages found in ' + STAGE); process.exit(1); }

    // Collapse the overlap: last transcription of a CA id wins.
    const byCa = new Map();
    let rows = 0;
    for (const f of files) {
        const page = JSON.parse(readFileSync(join(STAGE, f), 'utf8'));
        for (const v of page.venues || []) {
            if (v.ca_id == null) continue;
            byCa.set(Number(v.ca_id), { ...v, _page: page._page ?? f });
            rows++;
        }
    }
    console.log(`${files.length} page${files.length === 1 ? '' : 's'} · ${rows} rows · ${byCa.size} distinct CA venues`);
    console.log(WRITE ? 'WRITING\n' : 'PREVIEW — nothing will be saved. Re-run with --write.\n');

    const haveV = await get('venues?select=id,rt_code,"Venue Name","Venue ID",city,state');
    const vByCa = new Map(haveV.filter(v => v['Venue ID'] != null)
                               .map(v => [Number(v['Venue ID']), v]));
    const haveF = await get('fields?select=id,"Field ID","Field Name",venue_id');
    const fByCa = new Map(haveF.filter(f => f['Field ID'] != null)
                               .map(f => [Number(f['Field ID']), f]));

    let vNew = 0, vSame = 0, fNew = 0, fSame = 0;
    const conflicts = [], noField = [];
    let vNum = await nextNum('venues', 'RTV'), fNum = await nextNum('fields', 'RTF');

    for (const [caId, v] of [...byCa.entries()].sort((a, b) => a[0] - b[0])) {
        const existing = vByCa.get(caId);
        let venueRowId = existing ? existing.id : null;

        if (existing) {
            const nameDiff = norm(existing['Venue Name']) !== norm(v.name);
            const cityDiff = v.city && norm(existing.city) !== norm(v.city);
            if (nameDiff || cityDiff) {
                conflicts.push({ caId, ours: existing, theirs: v, nameDiff, cityDiff });
                continue;                       // flag and skip — never overwrite
            }
            vSame++;
        } else {
            // Report the code the DATABASE assigned, not one predicted here.
            // The trigger mints per STATE — EF Academy in Thornwood NY became
            // RTVNY002 while this log claimed RTVCT293. The row was right and
            // the report was wrong, which is the worse of the two.
            let code = '(pending)';
            if (WRITE) {
                const r = await fetch(URL + '/rest/v1/venues', {
                    method: 'POST', headers: { ...H, Prefer: 'return=representation' },
                    body: JSON.stringify({ 'Venue Name': v.name, 'Venue ID': caId,
                                           city: v.city || null, state: v.state || 'CT' }) });
                if (!r.ok) { console.log(`   ✗ CA ${caId} ${v.name}: ` + await r.text()); continue; }
                const [ins] = await r.json();
                venueRowId = ins.id;
                if (!ins.rt_code) {
                    const st = (v.state || 'CT').toUpperCase();
                    code = 'RTV' + st + String(vNum++).padStart(3, '0');
                    await fetch(`${URL}/rest/v1/venues?id=eq.${ins.id}`, { method: 'PATCH', headers: H,
                        body: JSON.stringify({ rt_code: code }) });
                } else {
                    code = ins.rt_code;
                }
            } else {
                code = 'RTV' + (v.state || 'CT').toUpperCase() + String(vNum++).padStart(3, '0') + '?';
            }
            console.log(`+ venue ${code}  CA ${String(caId).padEnd(5)} ${v.name}${v.city ? '  (' + v.city + ')' : ''}`);
            vNew++;
        }

        const fields = v.fields || [];
        if (!fields.length) { noField.push(v.name); continue; }

        for (const f of fields) {
            if (f.ca_id != null && fByCa.has(Number(f.ca_id))) { fSame++; continue; }
            let code = '(pending)';
            if (WRITE && venueRowId) {
                const r = await fetch(URL + '/rest/v1/fields', {
                    method: 'POST', headers: { ...H, Prefer: 'return=representation' },
                    body: JSON.stringify({ venue_id: venueRowId, 'Venue ID': caId,
                                           'Field ID': f.ca_id ?? null, 'Field Name': f.name,
                                           state: v.state || 'CT' }) });
                if (!r.ok) { console.log(`       ✗ ${f.name}: ` + await r.text()); continue; }
                const [ins] = await r.json();
                if (!ins.rt_code) {
                    const st = (v.state || 'CT').toUpperCase();
                    code = 'RTF' + st + String(fNum++).padStart(3, '0');
                    await fetch(`${URL}/rest/v1/fields?id=eq.${ins.id}`, { method: 'PATCH', headers: H,
                        body: JSON.stringify({ rt_code: code }) });
                } else {
                    code = ins.rt_code;
                }
            } else {
                code = 'RTF' + (v.state || 'CT').toUpperCase() + String(fNum++).padStart(3, '0') + '?';
            }
            console.log(`    + field ${code}  CA ${String(f.ca_id ?? '—').padEnd(5)} ${f.name}`);
            fNew++;
        }
    }

    console.log(`\nvenues: ${vNew} new · ${vSame} already matched`);
    console.log(`fields: ${fNew} new · ${fSame} already held`);
    console.log(`venues CA lists with no fields: ${noField.length}  (normal — not a gap)`);

    if (conflicts.length) {
        console.log(`\n⚠️  ${conflicts.length} CONFLICT${conflicts.length === 1 ? '' : 'S'} — skipped, decide by hand:`);
        conflicts.forEach(c => {
            console.log(`   CA ${c.caId}  ${c.ours.rt_code}`);
            console.log(`      ours:  "${c.ours['Venue Name']}"  ${c.ours.city || '—'}`);
            console.log(`      CA:    "${c.theirs.name}"  ${c.theirs.city || '—'}`
                        + `   ${[c.nameDiff && 'name', c.cityDiff && 'city'].filter(Boolean).join(' + ')} differ`);
        });
    }
    if (!WRITE) console.log('\nnothing was saved. re-run with --write');
})();
