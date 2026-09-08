// ============================================================================
// NECONN COMPETITIVE games, Fall 2026 — from Tod's "COMP GAMES" Google Sheet
// Built 2026-09-08. Nine games, 9/12 through 10/25.
//
//   node scripts/import-neconn-comp-fall2026.mjs           preview, writes nothing
//   node scripts/import-neconn-comp-fall2026.mjs --write   inserts
//
// WHY THIS IS A SEPARATE SCRIPT: these are COMPETITIVE games (game_type 'Comp'),
// a different set from the 14 NECONN REC games already loaded for 9/12. Verified
// before building: zero overlap — none of these nine exist in the games table.
//
// VERIFIED AGAINST THE LIVE DB, not assumed:
//   * games."Venue ID" uses CENTRAL ASSIGN's id space, not venues.id.
//     Proof: an existing NECONN row carries 1072, and venues."Venue ID" = 1072
//     is RTVCT029. venues.id 1072 does not exist. So we write CA ids here.
//   * RTVCT033 = Woodstock Elementary, CA Venue ID 915, CA Field 9009 ("WES")
//   * RTVCT026 = Prince Hill Field,    CA Venue ID 887, CA Field 1290
//   * game_type 'Comp' and season 'Fall 2026' are both already in use.
//
// ⚠️ ALL NINE ARE SINGLE-REFEREE GAMES. NECONN crew rules set ar1=false and
//    ar2=false for BOTH U9 and U10, so each game needs one center and no ARs.
//    Nine center assignments, not twenty-seven.
// ============================================================================
import { createClient } from '@supabase/supabase-js';

const WRITE = process.argv.includes('--write');
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

// ✅ CONFIRMED BY TOD, 2026-09-08: "that's the coaches name — Cante". NOT a
// truncated "Canterbury". NECONN's competitive teams are named for their coaches
// — Nichols, Campbell, Cante — which is why they do not look like the town names
// used on the rec side (Brooklyn, Putnam, Killingly...). Left verbatim.
const CANTE_TEAM = 'NECONN - Cante';

const WES   = { venueId: 915, fieldId: 9009 };  // Woodstock Elementary
const PRINCE= { venueId: 887, fieldId: 1290 };  // Prince Hill Field

// date, time (24h, null = TBD), home team, away club, away team, age, venue
const ROWS = [
  ['2026-09-12', '10:00:00', 'NECONN - Nichols',  'Neconn Soccer',    'NECONN - Campbell', 'U10', WES],
  ['2026-09-19', '09:30:00', 'NECONN - Nichols',  'Ellington Soccer', 'Ellington',         'U10', WES],
  ['2026-09-19', '11:00:00', 'NECONN - Campbell', 'Coventry Soccer',  'Coventry',          'U10', WES],
  ['2026-09-27', null,       'NECONN - Campbell', 'CWSA',             'CWSA',              'U10', WES],
  ['2026-10-03', '14:00:00', CANTE_TEAM,          'Coventry Soccer',  'Coventry',          'U9',  PRINCE],
  ['2026-10-04', '14:00:00', CANTE_TEAM,          'Ellington Soccer', 'Ellington',         'U9',  PRINCE],
  ['2026-10-18', '13:00:00', CANTE_TEAM,          'WAM Soccer',       'WAM Red',           'U9',  PRINCE],
  ['2026-10-24', '10:30:00', 'NECONN - Nichols',  'Lebanon Soccer',   'Lebanon',           'U10', WES],
  ['2026-10-25', '15:00:00', 'NECONN - Campbell', 'Bolton Soccer',    'Bolton',            'U10', WES],
];

const rows = ROWS.map(([date, time, home, awayClub, away, age, v]) => ({
  date,
  time,
  status:        'Scheduled',
  'Age Group':   age,
  'Home Team':   home,
  'Away Team':   away,
  'Venue ID':    v.venueId,
  'Field ID':    v.fieldId,
  'Source Club': 'NECONN',
  'Uploaded By': 'Assignor',
  game_type:     'Comp',
  Gender:        'Boys',
  season:        'Fall 2026',
  home_club:     'NECONN Soccer Club',
  away_club:     awayClub,
  is_unsanctioned: false,
}));

async function main() {
  // Refuse to double-insert. Match on the natural key: date + home + away.
  const dates = [...new Set(rows.map(r => r.date))];
  const { data: existing, error } = await db
    .from('games')
    .select('id,date,"Home Team","Away Team"')
    .in('date', dates)
    .eq('Source Club', 'NECONN');
  if (error) { console.error('Lookup failed:', error.message); process.exit(1); }

  const key  = r => `${r.date}|${r['Home Team']}|${r['Away Team']}`;
  const have = new Set((existing || []).map(key));
  const fresh = rows.filter(r => !have.has(key(r)));
  const dupes = rows.filter(r =>  have.has(key(r)));

  console.log(`NECONN competitive, Fall 2026 — ${rows.length} games in the sheet`);
  console.log(`  already in the table : ${dupes.length}`);
  console.log(`  would insert         : ${fresh.length}`);
  if (dupes.length) dupes.forEach(r => console.log('   SKIP (exists)', key(r)));
  console.log('');
  fresh.forEach(r => console.log(
    `   ${r.date}  ${r.time ? r.time.slice(0,5) : ' TBD '}  ${r['Age Group'].padEnd(4)}  ` +
    `${r['Home Team'].padEnd(20)} vs ${String(r['Away Team']).padEnd(20)} ` +
    `venue ${r['Venue ID']}`));

  const noTime = fresh.filter(r => !r.time);
  if (noTime.length) {
    console.log('');
    console.log(`⚠️  ${noTime.length} game(s) have NO KICKOFF TIME and will import with time = null:`);
    noTime.forEach(r => console.log(`     ${r.date}  ${r['Home Team']} vs ${r['Away Team']}`));
    console.log('    They will sit in the workstation and CAN be assigned, but Central Assign');
    console.log('    REQUIRES a time — they cannot be exported until Ross supplies one.');
  }

  if (!WRITE) {
    console.log('');
    console.log('─'.repeat(70));
    console.log('PREVIEW ONLY — nothing written. Re-run with --write to insert.');
    console.log('─'.repeat(70));
    return;
  }
  if (!fresh.length) { console.log('\nNothing to insert.'); return; }

  const { data, error: insErr } = await db.from('games').insert(fresh).select('id');
  if (insErr) { console.error('INSERT FAILED:', insErr.message); process.exit(1); }
  console.log(`\n✓ inserted ${data.length} games. ids: ${data.map(d => d.id).join(', ')}`);
}

main();
