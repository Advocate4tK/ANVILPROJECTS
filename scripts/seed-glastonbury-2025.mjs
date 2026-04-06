/**
 * seed-glastonbury-2025.mjs
 * Reads the three 2025 Hartwell tournament CSVs from disk and inserts
 * all games into the Supabase games table.
 *
 * Run: node scripts/seed-glastonbury-2025.mjs
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// ── Config ────────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://kaniccdqieyesezpousu.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';

const CSV_FILES = {
    fri: 'Central Assign/UPLOADS/ERIC TOURNY/Hartwell tournamemnt Friday schedule upload 2025 (1).csv',
    sat: 'Central Assign/UPLOADS/ERIC TOURNY/Hartwell tournamemnt Saturday schedule upload 2025 v1.csv',
    sun: 'Central Assign/UPLOADS/ERIC TOURNY/Hartwell tournamemnt Sunday schedule upload 2025 v1.csv',
};

// ── Supabase ──────────────────────────────────────────────────────────────
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────
function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (!lines.length) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const vals = line.split(',');
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim(); });
        return obj;
    }).filter(r => r['Home Team'] && r['Date']);
}

function parseDateToISO(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    const [m, d, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function parseTimeTo24h(timeStr) {
    const match = (timeStr || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return timeStr;
    let [, h, m, ampm] = match;
    h = parseInt(h, 10);
    if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}:00`;
}

function normalizeGender(g) {
    const v = (g || '').toLowerCase().trim();
    if (v === 'm' || v === 'b') return 'M';
    if (v === 'f' || v === 'g') return 'F';
    return (g || '').toUpperCase();
}

function birthYearToAgeGroup(yearStr) {
    const y = parseInt(yearStr, 10);
    if (isNaN(y)) return yearStr;
    return `U${2025 - y}`;
}

function extractAgeGroupFromTeam(teamName) {
    const match = (teamName || '').match(/[Uu](\d+)/);
    return match ? `U${match[1]}` : '';
}

function csvRowToGame(row, isHART) {
    const date      = parseDateToISO(row['Date'] || '');
    const time      = parseTimeTo24h(row['Time'] || '');
    const homeTeam  = row['Home Team'] || '';
    const awayTeam  = row['Away Team'] || '';
    const venueId   = parseFloat(row['Venue'] || '0') || null;
    const fieldId   = parseFloat(row['Field'] || '0') || null;
    const gender    = normalizeGender(row['Gender'] || '');

    let ageGroup, gameId;

    if (isHART) {
        ageGroup = birthYearToAgeGroup(row['Age Group'] || '');
        gameId   = row['game_id'] ? String(row['game_id']) : '';
    } else {
        ageGroup = extractAgeGroupFromTeam(homeTeam);
        gameId   = '';
    }

    const division = ageGroup + (gender === 'M' ? 'B' : gender === 'F' ? 'G' : '');

    return {
        date,
        time,
        'Home Team':   homeTeam,
        'Away Team':   awayTeam,
        'Age Group':   ageGroup,
        'Venue ID':    venueId,
        'Field ID':    fieldId,
        'GAME ID':     gameId || null,
        game_type:     'Tournament',
        'Source Club': 'Glastonbury',
        division,
        'Game Status': 'Completed',
        status:        'completed',
    };
}

// ── Load and transform ────────────────────────────────────────────────────
function loadDay(day) {
    const path = CSV_FILES[day];
    console.log(`\n  Reading ${day.toUpperCase()}: ${path}`);
    const text = readFileSync(path, 'utf8');
    const rows = parseCSV(text);
    const isHART = 'game_id' in rows[0];
    const games = rows.map(r => csvRowToGame(r, isHART));
    console.log(`  → ${games.length} games parsed (${isHART ? 'HART schema' : 'simplified schema'})`);
    return games;
}

// ── Insert with batching ──────────────────────────────────────────────────
async function insertBatch(games, label) {
    const BATCH = 50;
    let ok = 0, fail = 0;

    for (let i = 0; i < games.length; i += BATCH) {
        const chunk = games.slice(i, i + BATCH);
        process.stdout.write(`\r  Inserting ${label}... ${Math.min(i + BATCH, games.length)}/${games.length}`);
        const { error } = await db.from('games').insert(chunk);
        if (error) {
            console.error(`\n  ❌ Batch ${i}-${i + BATCH} error: ${error.message}`);
            fail += chunk.length;
        } else {
            ok += chunk.length;
        }
    }
    console.log(`\n  ✅ ${label}: ${ok} inserted${fail ? `, ${fail} failed` : ''}`);
    return { ok, fail };
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n═══════════════════════════════════════════════════');
    console.log('  Glastonbury Spring Warmup 2025 — Seed Script');
    console.log('═══════════════════════════════════════════════════');
    console.log('\nLoading CSV files...');

    const friGames = loadDay('fri');
    const satGames = loadDay('sat');
    const sunGames = loadDay('sun');

    const total = friGames.length + satGames.length + sunGames.length;
    console.log(`\nTotal games to insert: ${total}`);
    console.log('\nInserting to Supabase...');

    const results = [];
    results.push(await insertBatch(friGames, 'Friday Apr 25'));
    results.push(await insertBatch(satGames, 'Saturday Apr 26'));
    results.push(await insertBatch(sunGames, 'Sunday Apr 27'));

    const totalOk   = results.reduce((s, r) => s + r.ok, 0);
    const totalFail = results.reduce((s, r) => s + r.fail, 0);

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`  DONE — ${totalOk} games seeded${totalFail ? `, ${totalFail} failed` : ''}`);
    console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
    console.error('\nFatal error:', err.message);
    process.exit(1);
});
