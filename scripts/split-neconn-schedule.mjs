// ============================================================================
// Split "FULL NECONN SCHEDULE.xlsx" into one upload CSV per club.
// 2026-09-10
//
//   node scripts/split-neconn-schedule.mjs            preview, writes nothing
//   node scripts/split-neconn-schedule.mjs --write    writes the three CSVs
//
// WHY: the club portal uploads under ONE Source Club at a time, and that sheet
// carries all three of the coalition's clubs mixed together. Tod, 2026-09-10:
// "There are exactly three clubs involved here, NECONN, Plainfield, and
// Canterbury."
//
// ⚠️ SOURCE CLUB COMES FROM THE HOME TEAM, NOT THE VENUE.
//    Tod: "The home team gives away what club is the home club." Team names are
//    town names, and the towns belong to clubs. Splitting by venue instead gets
//    87 games wrong, because clubs host at each other's fields all season.
//
// ⚠️ THE "Not for Neconn Ref Assignment" COLUMN IS NOT A CLUB MARKER.
//    It disagrees with the home club on 101 of 214 rows in BOTH directions — a
//    Killingly vs Woodstock1 game at Old Killingly HS is flagged, and is already
//    assigned by NECONN in the live system. Until its meaning is confirmed it is
//    carried through into Notes and changes nothing else.
// ============================================================================
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const WRITE = process.argv.includes('--write');
const SRC   = 'D:/Docs n Files/TLS Share/ASSIGNOR/CA UPLOADS/FULL NECONN SCHEDULE.xlsx';
// ⚠️ REFTOOL UPLOADS, not CA UPLOADS. Two opposite directions of travel:
//    CA UPLOADS holds files going OUT to Central Assign after assigning.
//    REFTOOL UPLOADS holds files coming IN to Referee Tool from a club.
//    Mixing them is how a CA export gets fed back into the portal as new games.
const OUT   = 'D:/Docs n Files/TLS Share/ASSIGNOR/REFTOOL UPLOADS';

// ── Club ownership, by the town the home team is named for ──────────────────
// NECONN's member towns, from the club's own Our Staff page.
const NECONN_TOWNS = ['brooklyn', 'brookyn', 'eastford', 'killingly', 'pomfret',
                      'putnam', 'thompson', 'woodstock', 'woodtock'];

const CLUBS = {
  'NECONN':                          { slug: 'neconn' },
  'Plainfield Youth Soccer':         { slug: 'plainfield' },
  'Canterbury Athletic Association': { slug: 'canterbury' },
};

function homeClubOf(team) {
  const s = String(team || '').toLowerCase().replace(/[^a-z]/g, '');
  if (s.startsWith('canterbury'))                       return 'Canterbury Athletic Association';
  if (s.startsWith('plainfield') || s.startsWith('plainfeild')) return 'Plainfield Youth Soccer';
  if (NECONN_TOWNS.some(t => s.startsWith(t)))          return 'NECONN';
  return null;
}

// ── Venue: the sheet mixes RT codes, venue names, and blanks ────────────────
// ⚠️ The NAMES here are the sheet's, and two of them are simply wrong. Central
// Assign is the record — CA #951 is "Shepard Hill Elementary School" and CA #941
// is "Sterling Community Center". Tod, 2026-09-10: "the bottom line will always
// be central assign. Ours is right, so we don't want to make changes because
// some spreadsheet has the wrong spelling." So the correction happens HERE, at
// the boundary, and the venue records are left alone.
const VENUE_BY_NAME = {
  'shepherd hill elementary school': 'RTVCT035',   // sheet says Shepherd; CA says Shepard
  'sterling town hall':              'RTVCT036',   // CA calls it Sterling Community Center
  'plainfield central ms':           'RTVCT527',
};
const BLANK_VENUE_IS = 'RTVCT073';                 // every blank cell is Manship Park

// Field names as they actually exist, per venue. A venue absent from here has no
// fields on file and must ship a blank Field — inventing one is a rejected row.
const FIELDS = {
  RTVCT022: { '1': 'RTFCT047', '2': 'RTFCT048', '3': 'RTFCT049' },
  RTVCT026: { '1': 'RTFCT057', '2': 'RTFCT058', '3': 'RTFCT059', '4': 'RTFCT060' },
  RTVCT029: { '1': 'RTFCT065' },
  RTVCT028: { '1': 'RTFCT062', '2': 'RTFCT063', '3': 'RTFCT064' },
  RTVCT073: { '1': 'RTFCT118', '2': 'RTFCT123' },
};

function venueCodeOf(raw) {
  const v = String(raw || '').trim();
  if (!v) return BLANK_VENUE_IS;
  if (/^RTVCT/i.test(v)) return v.toUpperCase();
  return VENUE_BY_NAME[v.toLowerCase()] || null;
}

function fieldCodeOf(venueCode, raw) {
  const f = String(raw || '').trim();
  if (!f) return '';
  const map = FIELDS[venueCode];
  if (!map) return '';                       // venue has no fields on file
  return map[f.replace(/[^0-9]/g, '')] || '';
}

// ── Team names: the sheet has typos and inconsistent spacing ────────────────
// Left uncorrected these become separate teams in the schedule's team filter —
// "Woodstock 1" and "Woodstock1" sitting next to each other as though they were
// different sides.
function cleanTeam(raw) {
  let t = String(raw || '').trim().replace(/\s+/g, ' ');
  t = t.replace(/\bBrookyn\b/i, 'Brooklyn')
       .replace(/\bPlainfeild\b/i, 'Plainfield')
       .replace(/\bWoodtock\b/i, 'Woodstock');
  // Collapse "Woodstock 1" and "Woodstock1" onto the spaced form.
  t = t.replace(/^([A-Za-z]+)\s*(\d+)$/, '$1 $2');
  return t;
}

// A spreadsheet is typed by a person, so a time can be a word. "Noon" reached
// row 47 and would have been the single rejected row in 189.
function cleanTime(raw) {
  const t = String(raw || '').trim();
  if (/^noon$/i.test(t))     return '12:00 PM';
  if (/^midnight$/i.test(t)) return '12:00 AM';
  return t;
}

// "9/12/26" → "2026-09-12"
function isoDate(raw) {
  const m = String(raw || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return String(raw || '').trim();
  const yr = m[3].length === 2 ? '20' + m[3] : m[3];
  return `${yr}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

const HEADERS = ['Date','Time','Home Team','Away Club','Away Team','Age Group',
                 'Gender','Game Type','Scrimmage','Venue','Field','Notes'];

const csvCell = v => {
  const t = String(v ?? '');
  return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
};

// ── ⚠️ DROP ANYTHING ALREADY IN THE DATABASE ────────────────────────────────
// Week 1 was uploaded for all three clubs before this sheet arrived, and the
// sheet is the WHOLE season — so a straight upload would have duplicated 25
// games. There is no unique constraint on games to catch that afterwards; the
// only sign would be every week-one fixture appearing twice on the public
// schedule, with referees on one copy and not the other.
//
// Matched on date + time + both team names, normalised, which is the same
// natural key the import scripts use.
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

// ── ⚠️ WRITE CENTRAL ASSIGN'S OWN CLUB NAME, NOT THE SHEET'S ────────────────
// The uploader validates Away Club against ca_clubs. The sheet says "Canterbury
// Soccer Club"; Central Assign calls them "Cantebury Soccer Club" — its own
// typo, which we mirror rather than correct. That mismatch rejected 51 of 189
// rows.
//
// Resolving here and emitting the CANONICAL name means the files depend on no
// alias existing. Aliases are a convenience for a human typing by hand; a
// generated file should already be exactly right.
const { data: _caClubs, error: _ccErr } = await db.from('ca_clubs').select('name,aliases');
if (_ccErr) { console.error('could not load ca_clubs: ' + _ccErr.message); process.exit(1); }
const _clubKey = v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const CA_NAME = new Map();
_caClubs.forEach(c => {
  CA_NAME.set(_clubKey(c.name), c.name);
  (c.aliases || []).forEach(a => CA_NAME.set(_clubKey(a), c.name));
});
// The sheet's own wording, where it matches neither a name nor an alias.
// 2026-09-10: Central Assign corrected its own spelling to 'Canterbury Soccer
// Club'. Both directions are mapped so this script works whether or not
// sql/canterbury-club-rename.sql has been applied yet.
[['Canterbury Soccer Club', 'Cantebury Soccer Club'],
 ['Cantebury Soccer Club',  'Canterbury Soccer Club']].forEach(([from, to]) => {
  if (!CA_NAME.has(_clubKey(from)) && CA_NAME.has(_clubKey(to))) {
    CA_NAME.set(_clubKey(from), CA_NAME.get(_clubKey(to)));
  }
});
const unresolvedClubs = new Set();
function caClubName(raw) {
  const hit = CA_NAME.get(_clubKey(raw));
  if (!hit) unresolvedClubs.add(String(raw || '(blank)'));
  return hit || String(raw || '');
}

// ── Run ─────────────────────────────────────────────────────────────────────
const wb   = XLSX.readFile(SRC, { cellDates: true });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false });

const out = {};
const unresolved = [];
Object.keys(CLUBS).forEach(c => out[c] = []);

rows.forEach((r, i) => {
  const club = homeClubOf(r['Home team']);
  if (!club) { unresolved.push(`row ${i + 2}: home team "${r['Home team']}" matches no club`); return; }

  const venue = venueCodeOf(r['Venue']);
  if (!venue) { unresolved.push(`row ${i + 2}: venue "${r['Venue']}" does not resolve`); return; }

  const flag = String(r['__EMPTY'] || '').trim();

  out[club].push([
    isoDate(r['Date (mm/dd/yyyy']),
    cleanTime(r['Time']),
    cleanTeam(r['Home team']),
    caClubName(r['Away Club']),
    cleanTeam(r['Away team']),
    String(r['Age group'] || '').trim(),
    String(r['Gender'] || '').trim(),
    String(r['Game Type'] || 'Rec').trim(),
    '',                                  // Scrimmage — none flagged in this sheet
    venue,
    fieldCodeOf(venue, r['Field']),
    flag,                                // carried, not acted on
  ]);
});

console.log(`read ${rows.length} rows from ${path.basename(SRC)}\n`);


const keyNorm = v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const to24 = t => {
  const m = String(t).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return String(t || '');
  let h = +m[1];
  if (/pm/i.test(m[3]) && h !== 12) h += 12;
  if (/am/i.test(m[3]) && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
};

let skipped = 0;
for (const club of Object.keys(out)) {
  const { data, error } = await db.from('games')
    .select('date,time,"Home Team","Away Team"').eq('Source Club', club);
  if (error) { console.error(`could not check ${club}: ${error.message}`); process.exit(1); }
  const have = new Set((data || []).map(g =>
    `${g.date}|${String(g.time || '').slice(0, 5)}|${keyNorm(g['Home Team'])}|${keyNorm(g['Away Team'])}`));
  const before = out[club].length;
  out[club] = out[club].filter(l =>
    !have.has(`${l[0]}|${to24(l[1])}|${keyNorm(l[2])}|${keyNorm(l[4])}`));
  skipped += before - out[club].length;
}
if (skipped) console.log(`
skipping ${skipped} game(s) already in the database`);

Object.entries(out).forEach(([club, lines]) => {
  const file = path.join(OUT, `${CLUBS[club].slug}-fall2026-upload.csv`);
  console.log(`   ${club.padEnd(34)} ${String(lines.length).padStart(3)} games -> ${path.basename(file)}`);
  if (WRITE) {
    const content = [HEADERS.map(csvCell).join(','), ...lines.map(l => l.map(csvCell).join(','))].join('\r\n') + '\r\n';
    fs.writeFileSync(file, content, 'utf8');
  }
});

const total = Object.values(out).reduce((n, l) => n + l.length, 0);
console.log(`\n   total written: ${total} of ${rows.length}`);
if (unresolved.length) {
  console.log(`\n⚠️ ${unresolved.length} row(s) NOT written:`);
  unresolved.forEach(u => console.log('   ' + u));
}
const noField = Object.values(out).flat().filter(l => !l[10]).length;
console.log(`\n   rows shipping a blank Field: ${noField} (venues with no fields on file, or no field given)`);
if (unresolvedClubs.size) {
  console.log('');
  console.log('WARNING: away club name(s) resolving to nothing in ca_clubs - written verbatim and WILL reject:');
  [...unresolvedClubs].forEach(c => console.log('   ' + c));
}
if (!WRITE) console.log('\nPREVIEW ONLY — re-run with --write to create the files.');
