/**
 * seed-glastonbury-2026-games.mjs
 *
 * Imports Glastonbury Hartwell 2026 tournament games from the MASTER tab
 * of Eric's assignment spreadsheet into the referee tool Supabase games table.
 *
 * Source: TOURNAMENT/Glast 26/2026 Tournament Ref Assignments 3-31-26.xlsx
 *   - Rows 1-34:  2025 data — SKIP
 *   - Row 35:     SATURDAY header
 *   - Rows 37-370: Saturday 2026 games
 *   - Row 371:    SUNDAY header
 *   - Rows 373+:  Sunday 2026 games
 *   - Col M (12): Eric's assignment notes — imported as notes field
 *
 * Run:      node scripts/seed-glastonbury-2026-games.mjs
 * Dry run:  node scripts/seed-glastonbury-2026-games.mjs --dry-run
 */

import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

const SUPABASE_URL = 'https://kaniccdqieyesezpousu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';
const XLSX_PATH    = path.resolve(__dirname, '../TOURNAMENT/Glast 26/2026 Tournament Ref Assignments 3-31-26.xlsx');

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Site map: Eric's field label prefix → { venueId, venueName } ──────────
// Confirmed site numbers 1-12. Charter Oak + Veterans = null (TBD from Eric).
const SITE_MAP = {
    'addison':      { venueId: 123,  venueName: 'Addison Park' },
    'buckingham':   { venueId: 1017, venueName: 'Buckingham Park' },
    'magnet':       { venueId: 645,  venueName: 'GEHMS / Magnet' },     // site 3
    'ghs':          { venueId: 567,  venueName: 'Glastonbury High School' },
    'welles':       { venueId: 1082, venueName: 'Gideon Welles School' },
    'hebron ave':   { venueId: 576,  venueName: 'Hebron Avenue School' },
    'irish':        { venueId: 314,  venueName: 'Irish American Home' },
    'knox lane':    { venueId: 1083, venueName: 'Knox Lane Fields' },
    'nayaug':       { venueId: 417,  venueName: 'Nayaug School' },
    'riv park':     { venueId: 506,  venueName: 'Riverfront Park' },
    'rotary':       { venueId: null, venueName: 'Rotary' },             // need VID confirmed
    'sms':          { venueId: 1021, venueName: 'Smith Middle School' },
    'charter oak':  { venueId: null, venueName: 'Charter Oak' },        // TBD
    'veterans':     { venueId: null, venueName: 'Veterans' },           // TBD
};

// ── Parse Eric's field label ──────────────────────────────────────────────
// e.g. "Addison 4 (9v9)" → { venueId, venueName, fieldLabel: "Field 4", format: "9v9" }
// e.g. "GHS 1 (11v11) turf" → { venueId, venueName, fieldLabel: "Field 1", format: "11v11 turf" }
// e.g. "SMS L3 (7v7)" → { venueId, venueName, fieldLabel: "Field L3", format: "7v7" }
function parseFieldLabel(raw) {
    const s = raw.trim();

    // Try each site key
    for (const [key, site] of Object.entries(SITE_MAP)) {
        if (s.toLowerCase().startsWith(key)) {
            const rest = s.slice(key.length).trim();
            // Extract field identifier (number or letter+number) and format
            const match = rest.match(/^([A-Z]?\d+)\s*(?:\(([^)]+)\))?\s*(.*)$/i);
            if (match) {
                const fieldNum    = match[1];
                const format      = match[2] || '';
                const extra       = match[3] ? match[3].trim() : '';
                const fieldLabel  = `Field ${fieldNum}`;
                const formatFull  = extra ? `${format} ${extra}`.trim() : format;
                return { ...site, fieldLabel, format: formatFull, raw };
            }
            // No field number (e.g. "Buckingham (11v11)")
            const fmtMatch = rest.match(/^\(([^)]+)\)/);
            return { ...site, fieldLabel: 'Field 1', format: fmtMatch ? fmtMatch[1] : '', raw };
        }
    }

    // Unknown venue
    return { venueId: null, venueName: raw, fieldLabel: 'Field 1', format: '', raw };
}

// Excel serial → ISO date
function serialToISO(s) {
    return new Date((s - 25569) * 86400 * 1000).toISOString().slice(0, 10);
}

// Excel time decimal → HH:MM:SS
function serialToTime(t) {
    if (!t && t !== 0) return null;
    const totalMin = Math.round(t * 24 * 60);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`;
}

// ── Load spreadsheet ──────────────────────────────────────────────────────
const wb   = XLSX.readFile(XLSX_PATH);
const ws   = wb.Sheets['MASTER'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Rows 36+ = actual game data (skip header rows 0-35)
const gameRows = rows.slice(36).filter(r =>
    typeof r[0] === 'number' && r[0] > 40000 && r[1] && r[1].toString().trim()
);

console.log(`Found ${gameRows.length} game rows in MASTER`);

const games = [];
const skipped = [];

for (const r of gameRows) {
    const dateISO  = serialToISO(r[0]);
    const fieldRaw = r[1].toString().trim();
    const timeVal  = r[2];
    const center   = r[3]?.toString().trim() || null;
    const ar1      = r[4]?.toString().trim() || null;
    const ar2      = r[5]?.toString().trim() || null;
    const age      = r[6]?.toString().trim() || null;
    const gender   = r[7]?.toString().trim() || null;
    const ericNote = r[12]?.toString().trim() || null;

    // Skip placeholder/TBD rows
    if (!age || age.toUpperCase() === 'XXX') {
        skipped.push({ reason: 'XXX/blank age', row: fieldRaw });
        continue;
    }

    // Skip rows with no time
    if (!timeVal && timeVal !== 0) {
        skipped.push({ reason: 'no time', row: fieldRaw });
        continue;
    }

    const parsed  = parseFieldLabel(fieldRaw);
    const timeISO = serialToTime(timeVal);

    // Clean ref names — strip 'x' placeholders
    const cleanRef = (v) => (v && v !== 'x' && v !== '0' && v !== '0' ? v : null);

    games.push({
        'date':           dateISO,
        'time':           timeISO,
        'Source Club':    'GLASTONBURY',
        'game_type':      'Tournament',
        'Game Status':    'Unassigned',
        'Uploaded By':    'seed-glastonbury-2026-games',
        'Age Group':      `${age} ${gender || ''}`.trim(),
        'Gender':         gender,
        'Venue ID':       parsed.venueId,
        'field':          parsed.fieldLabel,
        'notes':          [
            parsed.format ? `Format: ${parsed.format}` : null,
            ericNote ? `Eric: ${ericNote}` : null,
            parsed.venueId === null ? `VENUE TBD: ${parsed.venueName}` : null,
        ].filter(Boolean).join(' | ') || null,
        // Pre-load Eric's assignments where they exist
        'Center Referee': cleanRef(center),
        'AR 1':           cleanRef(ar1),
        'AR 2':           cleanRef(ar2),
        _venueName:       parsed.venueName,
    });
}

console.log(`Parsed: ${games.length} games, skipped: ${skipped.length}`);

// Summary by venue
const byVenue = {};
games.forEach(g => {
    const v = g._venueName;
    byVenue[v] = (byVenue[v] || 0) + 1;
});
console.log('\nGames by venue:');
Object.entries(byVenue).sort((a,b) => b[1]-a[1]).forEach(([v,c]) => console.log(`  ${c.toString().padStart(3)} | ${v}`));

const nullVenueCount = games.filter(g => g['Venue ID'] === null).length;
console.log(`\nVenue ID missing (TBD): ${nullVenueCount} games`);

// Summary by date
const byDate = {};
games.forEach(g => { byDate[g.date] = (byDate[g.date]||0)+1; });
console.log('By date:', byDate);

// Summary skipped
if (skipped.length) {
    console.log(`\nSkipped ${skipped.length} rows (XXX/no time):`);
    const skipGroups = {};
    skipped.forEach(s => { skipGroups[s.reason] = (skipGroups[s.reason]||0)+1; });
    Object.entries(skipGroups).forEach(([r,c]) => console.log(`  ${c} — ${r}`));
}

if (DRY_RUN) {
    console.log('\n-- DRY RUN -- no data written');
    process.exit(0);
}

// ── Insert in batches ─────────────────────────────────────────────────────
const insertGames = games.map(({ _venueName, ...g }) => g);

const BATCH = 50;
let inserted = 0;
for (let i = 0; i < insertGames.length; i += BATCH) {
    const batch = insertGames.slice(i, i + BATCH);
    const { error } = await db.from('games').insert(batch);
    if (error) {
        console.error(`Batch ${Math.floor(i/BATCH)+1} ERROR:`, error.message);
        process.exit(1);
    }
    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${insertGames.length}...`);
}

console.log(`\nDone. ${inserted} Glastonbury 2026 tournament games inserted.`);
