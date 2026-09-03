// Merge fields duplicated by the CA venue import.
//
//   node scripts/merge-duplicate-fields.mjs           preview
//   node scripts/merge-duplicate-fields.mjs --write   commit
//
// WHAT HAPPENED
// ca-venue-import.mjs deduped fields by CA Field ID only. Our hand-built
// fields have no CA Field ID, so nothing matched and CA's copy was inserted
// alongside — Glastonbury High School ended up with 18 rows for 9 pitches and
// Lions Club Mansfield with 28 for 14.
//
// WHY MERGE RATHER THAN DELETE THE OLD ROW
// Some games reference a field by our ROW id, not by CA Field ID (confirmed:
// 4 of the 19 field references in games resolve as row ids). Deleting the old
// row would orphan those games. So the OLD row survives and is updated with
// CA's name and CA's Field ID; the NEWLY IMPORTED duplicate is deleted.
//
// Result per pitch: one row, CA's name, CA's id, original row id intact.

const KEY = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';
const URL = 'https://kaniccdqieyesezpousu.supabase.co';
const H   = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const WRITE = process.argv.includes('--write');

const norm = s => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

// Reduce a field name to its DESIGNATOR — the bit that identifies which pitch
// it is, with the decoration removed:
//
//   "1"                   -> 1     "Field 1"          -> 1
//   "Field#11 9v9"        -> 11    "Field 1 4v4"      -> 1
//   "Field 01A"           -> 1a    "Buckingham #1"    -> 1
//   "Grass 2"             -> 2     "Turf"             -> null
//
// Sizes (4v4, 11v11) are stripped FIRST or they supply false digits. A name
// with no designator returns null and is never paired on this rule.
function designator(name) {
    const s = String(name || '').toLowerCase()
        .replace(/\d+\s*v\s*\d+/g, ' ')      // 9v9, 11 v 11
        .replace(/[#().,-]/g, ' ');
    const m = s.match(/(?:^|\s)0*(\d+)\s*([a-d])?(?=\s|$)/);
    return m ? m[1] + (m[2] || '') : null;
}

const get = async p => {
    const r = await fetch(URL + '/rest/v1/' + p, { headers: H });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    return j;
};

(async () => {
    const venues = await get('venues?select=id,rt_code,"Venue Name","Venue ID"');
    const fields = await get('fields?select=id,rt_code,"Field Name","Field ID",venue_id');
    const vById  = Object.fromEntries(venues.map(v => [v.id, v]));

    console.log(WRITE ? 'WRITING\n' : 'PREVIEW — nothing will be saved. Re-run with --write.\n');

    const byVenue = {};
    fields.forEach(f => { if (f.venue_id != null) (byVenue[f.venue_id] = byVenue[f.venue_id] || []).push(f); });

    let merged = 0, deleted = 0;
    const unmatched = [];

    for (const [vid, list] of Object.entries(byVenue)) {
        const olds = list.filter(f => f['Field ID'] == null);
        const news = list.filter(f => f['Field ID'] != null);
        if (!olds.length || !news.length) continue;

        const pairs = [];
        const takenNew = new Set();

        // A designator may only be used to pair when it is UNIQUE on both
        // sides of this venue. Two CA fields reducing to "1" would otherwise
        // let the merge pick one arbitrarily and delete the wrong row.
        const count = (arr, d) => arr.filter(x => designator(x['Field Name']) === d).length;

        for (const o of olds) {
            // 1. exact name — Lions Club Mansfield ("1" ↔ "1")
            let n = news.find(x => !takenNew.has(x.id) && norm(x['Field Name']) === norm(o['Field Name']));
            // 2. same designator — "11" ↔ "Field#11 9v9", "Field 1" ↔ "Field 1 4v4"
            if (!n) {
                const d = designator(o['Field Name']);
                if (d && count(olds, d) === 1 && count(news, d) === 1) {
                    n = news.find(x => !takenNew.has(x.id) && designator(x['Field Name']) === d);
                }
            }
            if (n) { takenNew.add(n.id); pairs.push([o, n]); }
            else unmatched.push({ v: vById[vid], f: o });
        }
        if (!pairs.length) continue;

        const v = vById[vid] || {};
        console.log(`${v.rt_code || '?'}  ${v['Venue Name'] || vid}   ${pairs.length} pair${pairs.length===1?'':'s'}`);
        for (const [o, n] of pairs) {
            console.log(`   keep ${String(o.rt_code).padEnd(10)} "${o['Field Name']}"`
                      + `  ->  "${n['Field Name']}"  CA ${n['Field ID']}`
                      + `      drop ${n.rt_code}`);
            if (WRITE) {
                const up = await fetch(`${URL}/rest/v1/fields?id=eq.${o.id}`, {
                    method: 'PATCH', headers: H,
                    body: JSON.stringify({ 'Field Name': n['Field Name'], 'Field ID': n['Field ID'] })
                });
                if (!up.ok) { console.log('      ✗ update failed: ' + await up.text()); continue; }
                const del = await fetch(`${URL}/rest/v1/fields?id=eq.${n.id}`, { method: 'DELETE', headers: H });
                if (!del.ok) { console.log('      ✗ delete failed: ' + await del.text()); continue; }
                deleted++;
            }
            merged++;
        }
        console.log('');
    }

    console.log(`${merged} pitch${merged===1?'':'es'} merged` + (WRITE ? ` · ${deleted} duplicate rows deleted` : ''));
    if (unmatched.length) {
        console.log(`\n${unmatched.length} of our field(s) had no CA counterpart at that venue — LEFT ALONE:`);
        unmatched.forEach(u => console.log(`   ${u.f.rt_code}  "${u.f['Field Name']}"  at ${u.v ? u.v['Venue Name'] : '?'}`));
    }
    if (!WRITE) console.log('\nnothing was saved. re-run with --write');
})();
