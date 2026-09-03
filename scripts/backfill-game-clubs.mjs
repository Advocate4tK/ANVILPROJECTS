// Backfill games.home_club / games.away_club on games entered before the club
// pickers existed (2026-09-03).
//
//   node scripts/backfill-game-clubs.mjs              preview from 2026-08-01
//   node scripts/backfill-game-clubs.mjs --from 2026-04-01   preview further back
//   node scripts/backfill-game-clubs.mjs --write      apply
//
// HOME comes from the Source Club's ca_club_id - a club's own games are its own,
// and that mapping was set in SQL against CA's list.
//
// AWAY is resolved from the "Away Team" text using the same three rules the club
// portal uses: strip a team qualifier (" - Boys 1", "-Boys B"), match a CA name
// exactly, else match an alias. Anything else is REPORTED AND LEFT ALONE. A guess
// here files somebody's game under the wrong club in Central Assign, which is
// worse than a blank a person can see.
//
// Fallback rows ("Other", "Referee Services Assignor") are never chosen
// automatically - they are a decision, not a default.

const KEY  = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';
const URL  = 'https://kaniccdqieyesezpousu.supabase.co';
const H    = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const args  = process.argv.slice(2);
const WRITE = args.includes('--write');
const FROM  = (args[args.indexOf('--from') + 1] || '').match(/^\d{4}-\d{2}-\d{2}$/)
    ? args[args.indexOf('--from') + 1] : '2026-08-01';

const get = async p => {
    const r = await fetch(`${URL}/rest/v1/${p}`, { headers: H });
    const j = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(j));
    return j;
};

const norm = v => String(v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const stripQualifier = raw => String(raw ?? '')
    .replace(/\s+[-–]\s+.*$/, '')
    .replace(/\s*[-–]\s*(?:boys|girls)\b.*$/i, '')
    .trim();

const caClubs = await get('ca_clubs?select=id,name,aliases,is_fallback&order=name');
const clubs   = await get('clubs?select=id,name,ca_club_id');
const real    = caClubs.filter(c => !c.is_fallback);

const caById   = Object.fromEntries(caClubs.map(c => [String(c.id), c.name]));
const homeFor  = Object.fromEntries(clubs.map(c => [norm(c.name), caById[String(c.ca_club_id)] || null]));

function resolveAway(raw) {
    const want = norm(stripQualifier(raw));
    if (!want) return null;
    const exact = real.filter(c => norm(c.name) === want);
    if (exact.length === 1) return exact[0].name;
    if (exact.length > 1) return null;                       // ambiguous, leave it
    const alias = real.filter(c => (c.aliases || []).some(a => norm(a) === want));
    return alias.length === 1 ? alias[0].name : null;
}

const games = await get(
    `games?select=id,date,"Source Club","Home Team","Away Team",home_club,away_club` +
    `&date=gte.${FROM}&order=date&limit=5000`);

const todo = games.filter(g => !g.home_club || !g.away_club);
console.log(`${games.length} games from ${FROM}; ${todo.length} missing a club\n`);

const plan = [], unresolved = [], noHome = [];

for (const g of todo) {
    const home = g.home_club || homeFor[norm(g['Source Club'])] || null;
    const away = g.away_club || resolveAway(g['Away Team']);
    if (!home) { noHome.push(g); continue; }
    if (!away) { unresolved.push(g); continue; }
    if (home === g.home_club && away === g.away_club) continue;
    plan.push({ g, home, away });
}

for (const { g, home, away } of plan) {
    console.log(`  ${String(g.id).padEnd(6)} ${g.date}  ${String(g['Source Club']).padEnd(22)} ` +
                `${home}  vs  ${away}` +
                (norm(away) === norm(g['Away Team']) ? '' : `   (from "${g['Away Team']}")`));
}

if (unresolved.length) {
    console.log(`\n${unresolved.length} away teams do NOT match any Central Assign club - left alone:`);
    const by = {};
    for (const g of unresolved) (by[g['Away Team']] ||= []).push(g.id);
    for (const k of Object.keys(by).sort()) console.log(`  ${JSON.stringify(k).padEnd(38)} ${by[k].length} game(s)  [${by[k].join(', ')}]`);
    console.log('  Fix by adding an alias in SQL, or set the club by hand in the workstation.');
}

if (noHome.length) {
    const names = [...new Set(noHome.map(g => g['Source Club']))];
    console.log(`\n${noHome.length} games whose Source Club has no ca_club_id - skipped: ${names.join(', ')}`);
    // Not all of these are mistakes. KOVA is a test account and RECREATION is
    // unsanctioned, so neither should ever have a CA club. The summer leagues are
    // a real question: they play under names Central Assign has no club for, and
    // "Referee Services Assignor" may be where they belong — a decision, not a
    // lookup, so this script will not make it.
    console.log('  Expected: KOVA (test) and RECREATION (unsanctioned). Anything else needs a decision.');
}

if (!WRITE) { console.log(`\npreview only - ${plan.length} rows would change. Re-run with --write`); process.exit(0); }

let done = 0;
for (const { g, home, away } of plan) {
    const r = await fetch(`${URL}/rest/v1/games?id=eq.${g.id}`, {
        method: 'PATCH', headers: H,
        body: JSON.stringify({ home_club: home, away_club: away })
    });
    if (!r.ok) { console.log(`  FAILED ${g.id}: ${r.status} ${await r.text()}`); continue; }
    done++;
}
console.log(`\nupdated ${done} of ${plan.length}`);
