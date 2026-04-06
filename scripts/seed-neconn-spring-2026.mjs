/**
 * seed-neconn-spring-2026.mjs
 *
 * Imports NECONN Spring 2026 rec games from Ross's Excel schedule into
 * the referee tool Supabase games table.
 *
 * Source: C:\Users\Daddy\Desktop\NECONN\SPRING REC\NeconnSoccerMatchesSpring2026.4.6.26.xlsx
 *
 * REAL DATA — source_club = NECONN, game_type = Rec
 *
 * Run: node scripts/seed-neconn-spring-2026.mjs
 * Dry run: node scripts/seed-neconn-spring-2026.mjs --dry-run
 */

import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

// ── Config ────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://kaniccdqieyesezpousu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';
const XLSX_PATH    = path.resolve(__dirname, '../../../NECONN/SPRING REC/NeconnSoccerMatchesSpring2026.4.6.26.xlsx');

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Team Maps ─────────────────────────────────────────────────────────────
// Key: `${Age} ${Division}` → { [teamNumber]: teamName }

const TEAM_MAP = {
    'U8 Girls': {
        1: 'Brooklyn Girls',
        2: 'Killingly Girls',
        3: 'Pomfret Girls',
        4: 'Putnam Girls',
        5: 'Thompson Girls',
        6: 'Woodstock Girls',
        7: 'Plainfield Girls 1',
        8: 'Plainfield Girls 2',
        9: 'Canterbury Girls',
    },
    'U8 Boys': {
        1:  'Canterbury Boys 1',
        2:  'Plainfield Boys 1',
        3:  'Brooklyn Boys',
        4:  'Killingly Boys 2',
        5:  'Putnam Boys 2',
        6:  'Thompson Boys',
        7:  'Woodstock Boys 2',
        8:  'Canterbury Boys 2',
        9:  'Plainfield Boys 2',
        10: 'Killingly Boys 1',
        11: 'Pomfret Boys',
        12: 'Putnam Boys 1',
        13: 'Woodstock Boys 3',
        14: 'Woodstock Boys 1',
    },
    'U10 Girls': {
        1: 'Woodstock Girls',
        2: 'Putnam Girls',
        3: 'Pomfret Girls',
        4: 'Killingly Girls',
        5: 'Brooklyn Girls 1',
        6: 'Brooklyn Girls 2',
        7: 'Canterbury Girls',
        8: 'Plainfield Girls 1',
        9: 'Plainfield Girls 2',
    },
    'U10 Boys': {
        1:  'Plainfield Boys 1',
        2:  'Plainfield Boys 2',
        3:  'Plainfield Boys 3',
        4:  'Canterbury Boys 1',
        5:  'Canterbury Boys 2',
        6:  'Brooklyn Boys 1',
        7:  'Brooklyn Boys 2',
        8:  'Killingly Boys 1',
        9:  'Killingly Boys 2',
        10: 'Pomfret Boys',
        11: 'Putnam Boys',
        12: 'Woodstock Boys 1',
        13: 'Woodstock Boys 2',
        14: 'Thompson Boys',
    },
    'U12 Girls': {
        1: 'Brooklyn Girls',
        2: 'Killingly Girls',
        3: 'Pomfret Girls',
        4: 'Putnam Girls',
        5: 'Plainfield Girls 1',
        6: 'Plainfield Girls 2',
        7: 'Woodstock Girls',
    },
    'U12 Boys': {
        1: 'Brooklyn Boys',
        2: 'Killingly Boys',
        3: 'Putnam Boys 1',
        4: 'Putnam Boys 2',
        5: 'Woodstock Boys 1',
        6: 'Plainfield Boys 1',
        7: 'Canterbury Boys',
        8: 'Plainfield Boys 2',
    },
    'U15 Coed': {
        1: 'Killingly',
        2: 'Pomfret',
        3: 'Woodstock',
        4: 'Plainfield 1',
        5: 'Plainfield 2',
        6: 'Canterbury',
    },
};

// ── Helpers ───────────────────────────────────────────────────────────────

// Excel serial → ISO date string (YYYY-MM-DD)
function excelSerialToISO(serial) {
    const date = new Date((serial - 25569) * 86400 * 1000);
    return date.toISOString().slice(0, 10);
}

// Time → HH:MM:SS (handles strings like '1pm', '10:45AM', 'Noon', and decimal fractions)
function parseTime(t) {
    if (typeof t === 'number') {
        // Excel decimal fraction of a day
        const totalMinutes = Math.round(t * 24 * 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    }
    if (typeof t === 'string') {
        const s = t.trim().toLowerCase();
        if (s === 'noon') return '12:00:00';
        // Handle "9AM", "2PM", "10:45AM", "12:30PM" etc.
        const match = s.match(/^(\d+)(?::(\d+))?\s*(am|pm)$/);
        if (match) {
            let h = parseInt(match[1], 10);
            const m = parseInt(match[2] || '0', 10);
            const ampm = match[3];
            if (ampm === 'pm' && h !== 12) h += 12;
            if (ampm === 'am' && h === 12) h = 0;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
        }
    }
    return null;
}

// ── Main ──────────────────────────────────────────────────────────────────

const wb = XLSX.readFile(XLSX_PATH);
const ws = wb.Sheets['Matches'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

const games = [];
let skipped = 0;

for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0] || !r[1]) continue; // skip empty rows

    const age      = String(r[0]).trim();   // U8, U10, U12, U15
    const division = String(r[1]).trim();   // Girls, Boys, Coed
    const homeNum  = r[2];
    const awayNum  = r[3];
    const dateSerial = r[4];
    const timeRaw  = r[5];
    const venue    = String(r[6] || '').trim();
    const fieldNum = r[7];

    const divKey = `${age} ${division}`;
    const map    = TEAM_MAP[divKey];

    if (!map) {
        console.warn(`  SKIP row ${i}: unknown division "${divKey}"`);
        skipped++;
        continue;
    }

    const homeTeam = map[homeNum];
    const awayTeam = map[awayNum];

    if (!homeTeam || !awayTeam) {
        console.warn(`  SKIP row ${i} [${divKey}]: unknown team # home=${homeNum} away=${awayNum}`);
        skipped++;
        continue;
    }

    const dateISO = excelSerialToISO(dateSerial);
    const timeParsed = parseTime(timeRaw);
    const fieldName = fieldNum ? `Field ${fieldNum}` : null;

    games.push({
        'Age Group':    divKey,
        'Home Team':    homeTeam,
        'Away Team':    awayTeam,
        'date':         dateISO,
        'time':         timeParsed,
        'field':        fieldName,
        'division':     division,
        'Source Club':  'NECONN',
        'game_type':    'Rec',
        'Game Status':  'Unassigned',
        'Uploaded By':  'seed-neconn-spring-2026',
        // Venue: stored as text in `field` col isn't ideal — add notes for now
        'notes':        venue ? `Venue: ${venue}` : null,
    });
}

console.log(`\nParsed ${games.length} games (skipped ${skipped})`);
if (games.length === 0) {
    console.log('Nothing to insert.');
    process.exit(0);
}

// Preview first 5
console.log('\nFirst 5 games:');
games.slice(0, 5).forEach(g => {
    console.log(`  [${g['Age Group']}] ${g['Home Team']} vs ${g['Away Team']} — ${g.date} ${g.time} | ${g.notes}`);
});

if (DRY_RUN) {
    console.log('\n-- DRY RUN -- no data written');
    process.exit(0);
}

// Insert in batches of 50
const BATCH = 50;
let inserted = 0;
for (let i = 0; i < games.length; i += BATCH) {
    const batch = games.slice(i, i + BATCH);
    const { error } = await db.from('games').insert(batch);
    if (error) {
        console.error(`Batch ${Math.floor(i / BATCH) + 1} ERROR:`, error.message);
        process.exit(1);
    }
    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${games.length}...`);
}

console.log(`\nDone. ${inserted} NECONN Spring 2026 rec games inserted.`);
