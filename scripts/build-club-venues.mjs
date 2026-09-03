// Fill club_venues from clubs.venues — backfill 2 of 2.
//
//   PowerShell, from the referee-tool folder:
//     node scripts/build-club-venues.mjs            preview
//     node scripts/build-club-venues.mjs --write    apply
//
// Run sql/club-venues-01-table.sql FIRST (DBeaver, Alt+X). That creates the
// table and does backfill 1 — the 47 venues carrying a club_name.
//
// This half reads clubs.venues, which is a text field holding CA venue ids in
// three different shapes at once:
//
//     123.0,"1,082.0",567.0,645.0,417.0,506.0,"1,021.0",1017,923,1149
//
// floats, bare ints, and thousands separators inside quotes. The tokenizer below
// is copied VERBATIM from parseAirtableIds() in club-game-submit.html, comment
// and all, because getting it subtly different is exactly how this broke before:
// an earlier version stripped the quotes first, then ran /[\d,]+/ over the
// result, which swallowed `1017,923,1149` as the single id 10179231149 and made
// Buckingham Park, Magnet School and Rotary Glastonbury disappear from the club
// portal's venue dropdown WHILE GAMES WERE BEING ENTERED AGAINST THEM.
//
// Nothing reads club_venues yet. This only fills it, so a wrong row here changes
// no screen — which is the whole point of doing it in two stages.

const KEY  = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';
const URL  = 'https://kaniccdqieyesezpousu.supabase.co';
const H    = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
const WRITE = process.argv.includes('--write');

const get = async p => {
    const r = await fetch(`${URL}/rest/v1/${p}`, { headers: H });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    return j;
};

// ⚠️ Split on commas OUTSIDE quotes FIRST, then strip. The quotes are the only
// thing distinguishing a thousands separator from a delimiter.
function parseAirtableIds(str) {
    if (!str) return [];
    const out = [];
    const tokens = String(str).match(/"[^"]*"|[^,]+/g) || [];   // quoted group = ONE id
    for (let t of tokens) {
        t = t.replace(/"/g, '').replace(/,/g, '').trim();
        if (!t) continue;
        const n = parseInt(t, 10);
        if (!isNaN(n) && n > 0) out.push(n);
    }
    return out;
}

const clubs  = await get('clubs?select=id,name,venues&order=name');
const venues = await get('venues?select=id,"Venue ID","Venue Name",club_name&limit=2000');
let existing = [];
try {
    existing = await get('club_venues?select=club_id,venue_id,source');
} catch (e) {
    console.log('club_venues does not exist yet — run sql/club-venues-01-table.sql first (DBeaver, Alt+X).');
    process.exit(1);
}

const byCaId = new Map(venues.filter(v => v['Venue ID']).map(v => [Number(v['Venue ID']), v]));
const have   = new Set(existing.map(r => `${r.club_id}|${r.venue_id}`));

console.log(`club_venues currently holds ${existing.length} rows ` +
            `(${existing.filter(r => r.source === 'club_name').length} from club_name)\n`);

const plan = [], missing = [];

for (const c of clubs) {
    const ids  = parseAirtableIds(c.venues);
    const rows = [];
    for (const caId of ids) {
        const v = byCaId.get(caId);
        if (!v) { missing.push({ club: c.name, caId }); continue; }
        if (have.has(`${c.id}|${v.id}`)) continue;
        rows.push({ club_id: c.id, venue_id: v.id, source: 'clubs_venues', _name: v['Venue Name'], _ca: caId });
    }
    const already = existing.filter(r => r.club_id === c.id).length;
    console.log(`${String(c.name).padEnd(31)} list:${String(ids.length).padStart(3)}  already:${String(already).padStart(3)}  new:${String(rows.length).padStart(3)}`);
    for (const r of rows) console.log(`    + ${String(r._ca).padEnd(6)} ${r._name}`);
    plan.push(...rows);
}

if (missing.length) {
    console.log(`\n${missing.length} ids in clubs.venues match no venue row — skipped:`);
    for (const m of missing) console.log(`  ${String(m.club).padEnd(31)} CA ${m.caId}`);
    console.log('  Either the venue was never imported, or the id is wrong. Neither is guessable here.');
}

const noList = clubs.filter(c => parseAirtableIds(c.venues).length === 0).map(c => c.name);
if (noList.length) {
    console.log(`\n${noList.length} clubs have NO venue list at all: ${noList.join(', ')}`);
    console.log('  They will scope to nothing, so the dropdowns must keep falling back to the full list.');
}

if (!WRITE) { console.log(`\npreview only — ${plan.length} rows would be inserted. Re-run with --write`); process.exit(0); }

let done = 0;
for (let i = 0; i < plan.length; i += 50) {
    const batch = plan.slice(i, i + 50).map(({ club_id, venue_id, source }) => ({ club_id, venue_id, source }));
    const r = await fetch(`${URL}/rest/v1/club_venues`, {
        method: 'POST',
        headers: { ...H, Prefer: 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify(batch)
    });
    if (!r.ok) { console.log(`  FAILED batch at ${i}: ${r.status} ${await r.text()}`); continue; }
    done += batch.length;
}
console.log(`\ninserted ${done} of ${plan.length}`);
