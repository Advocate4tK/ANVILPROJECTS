/**
 * seed-neconn-june-6.mjs
 *
 * Imports NECONN June 6 2026 schedule into the referee tool Supabase games table.
 * Source: D:/Docs n Files/TLS Share/ASSIGNOR/NECONN/GAMES/6-6.xlsx
 *
 * 38 games across:
 *  - Jun 5  Thu:  1 game  (U12 Girls evening)
 *  - Jun 6  Fri: 16 games (main weekend)
 *  - Jun 7  Sat:  1 game  (U9 Boys — NEW)
 *  - Jun 9  Mon:  4 games
 *  - Jun 12 Thu:  1 game  (U12 Girls evening)
 *  - Jun 13 Fri: 12 games
 *  - Jun 14 Sat:  2 games (U19 Coed + Gomes vs CWSA — NEW)
 *  - Jun 20 Fri:  1 game  (Gomes vs Lebanon — NEW)
 *
 * Run:     node scripts/seed-neconn-june-6.mjs
 * Dry run: node scripts/seed-neconn-june-6.mjs --dry-run
 */

import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');

const SUPABASE_URL = 'https://kaniccdqieyesezpousu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Venue CA IDs (real) + Field IDs
//  Old KHS         Venue=904   F1=9001  F2=9002  F3=9003
//  Prince Hill     Venue=613   F1=9004  F2=9005
//  Riverside Park  Venue=1072  F1=9006
//  Pomfret Rec     Venue=812   F1=9007
//  Rawson          Venue=914   F1=9008
//  WES             Venue=910   F1=9009

const GAMES = [

    // ── Jun 5 (Thursday) ─────────────────────────────────────────────────
    {
        'Age Group': 'U12 Girls', 'Home Team': 'Woodstock Girls', 'Away Team': 'Pomfret Girls',
        date: '2026-06-05', time: '18:00:00', field: 'Field 1', 'Gender': 'Girls',
        'Venue ID': 9003, 'Field ID': 9006,
    },

    // ── Jun 6 (Friday) ───────────────────────────────────────────────────
    // U8 Girls
    {
        'Age Group': 'U8 Girls', 'Home Team': 'Brooklyn Girls', 'Away Team': 'Killingly Girls',
        date: '2026-06-06', time: '13:00:00', field: 'Field 1', 'Gender': 'Girls',
        'Venue ID': 904,  'Field ID': 9001,
    },
    // U8 Boys
    {
        'Age Group': 'U8 Boys', 'Home Team': 'Plainfield Boys 2', 'Away Team': 'Putnam Boys 2',
        date: '2026-06-06', time: '13:00:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 904,  'Field ID': 9001,
    },
    {
        'Age Group': 'U8 Boys', 'Home Team': 'Killingly Boys 2', 'Away Team': 'Woodstock Boys 2',
        date: '2026-06-06', time: '14:00:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 904,  'Field ID': 9001,
    },
    {
        'Age Group': 'U8 Boys', 'Home Team': 'Thompson Boys', 'Away Team': 'Canterbury Boys 2',
        date: '2026-06-06', time: '14:00:00', field: 'Field 2', 'Gender': 'Boys',
        'Venue ID': 904,  'Field ID': 9002,
    },
    // U10 Girls
    {
        'Age Group': 'U10 Girls', 'Home Team': 'Pomfret Girls', 'Away Team': 'Brooklyn Girls 1',
        date: '2026-06-06', time: '10:45:00', field: 'Field 3', 'Gender': 'Girls',
        'Venue ID': 904,  'Field ID': 9003,
    },
    {
        'Age Group': 'U10 Girls', 'Home Team': 'Woodstock Girls', 'Away Team': 'Putnam Girls',
        date: '2026-06-06', time: '12:30:00', field: 'Field 1', 'Gender': 'Girls',
        'Venue ID': 904,  'Field ID': 9001,
    },
    // U10 Boys
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Killingly Boys 2', 'Away Team': 'Woodstock Boys 2',
        date: '2026-06-06', time: '10:45:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 613,  'Field ID': 9004,
    },
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Pomfret Boys', 'Away Team': 'Woodstock Boys 1',
        date: '2026-06-06', time: '10:45:00', field: 'Field 2', 'Gender': 'Boys',
        'Venue ID': 613,  'Field ID': 9005,
    },
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Putnam Boys', 'Away Team': 'Thompson Boys',
        date: '2026-06-06', time: '12:00:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 613,  'Field ID': 9004,
    },
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Plainfield Boys 1', 'Away Team': 'Killingly Boys 1',
        date: '2026-06-06', time: '10:45:00', field: 'Field 3', 'Gender': 'Boys',
        'Venue ID': 904,  'Field ID': 9003,
    },
    // U12 Girls
    {
        'Age Group': 'U12 Girls', 'Home Team': 'Brooklyn Girls', 'Away Team': 'Plainfield Girls 1',
        date: '2026-06-06', time: '09:00:00', field: 'Field 1', 'Gender': 'Girls',
        'Venue ID': 1072, 'Field ID': 9006,
    },
    {
        'Age Group': 'U12 Girls', 'Home Team': 'Pomfret Girls', 'Away Team': 'Putnam Girls',
        date: '2026-06-06', time: '10:30:00', field: 'Field 1', 'Gender': 'Girls',
        'Venue ID': 1072, 'Field ID': 9006,
    },
    // U12 Boys
    {
        'Age Group': 'U12 Boys', 'Home Team': 'Brooklyn Boys', 'Away Team': 'Putnam Boys 1',
        date: '2026-06-06', time: '09:00:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 812,  'Field ID': 9007,
    },
    {
        'Age Group': 'U12 Boys', 'Home Team': 'Killingly Boys', 'Away Team': 'Putnam Boys 2',
        date: '2026-06-06', time: '10:30:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 812,  'Field ID': 9007,
    },
    // U15 Coed
    {
        'Age Group': 'U15 Coed', 'Home Team': 'Killingly', 'Away Team': 'Plainfield 2',
        date: '2026-06-06', time: '12:30:00', field: 'Field 1', 'Gender': 'Coed',
        'Venue ID': 914,  'Field ID': 9008,
    },
    // U19 Coed (NEW 4.13.26)
    {
        'Age Group': 'U19 Coed', 'Home Team': 'NECONN U19 Team 3', 'Away Team': 'NECONN U19 Team 4',
        date: '2026-06-06', time: '15:00:00', field: 'Field 1', 'Gender': 'Coed',
        'Venue ID': 914,  'Field ID': 9008, notes: 'NEW 4.13.26 — team names TBD',
    },

    // ── Jun 7 (Saturday) ─────────────────────────────────────────────────
    // U9 Boys (NEW 4.13.26)
    {
        'Age Group': 'U9 Boys', 'Home Team': 'Campbell', 'Away Team': 'Coventry',
        date: '2026-06-07', time: '14:00:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 910,  'Field ID': 9009, notes: 'NEW 4.13.26',
    },

    // ── Jun 9 (Monday) ───────────────────────────────────────────────────
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Plainfield Boys 3', 'Away Team': 'Brooklyn Boys 2',
        date: '2026-06-09', time: '10:45:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 613,  'Field ID': 9004,
    },
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Canterbury Boys 1', 'Away Team': 'Brooklyn Boys 1',
        date: '2026-06-09', time: '10:45:00', field: 'Field 2', 'Gender': 'Boys',
        'Venue ID': 613,  'Field ID': 9005,
    },
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Pomfret Boys', 'Away Team': 'Woodstock Boys 2',
        date: '2026-06-09', time: '12:00:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 613,  'Field ID': 9004,
    },
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Putnam Boys', 'Away Team': 'Woodstock Boys 1',
        date: '2026-06-09', time: '10:45:00', field: 'Field 3', 'Gender': 'Boys',
        'Venue ID': 904,  'Field ID': 9003,
    },

    // ── Jun 12 (Thursday) ────────────────────────────────────────────────
    {
        'Age Group': 'U12 Girls', 'Home Team': 'Plainfield Girls 1', 'Away Team': 'Woodstock Girls',
        date: '2026-06-12', time: '18:00:00', field: 'Field 1', 'Gender': 'Girls',
        'Venue ID': 1072, 'Field ID': 9006,
    },

    // ── Jun 13 (Friday) ──────────────────────────────────────────────────
    // U8 Girls
    {
        'Age Group': 'U8 Girls', 'Home Team': 'Pomfret Girls', 'Away Team': 'Putnam Girls',
        date: '2026-06-13', time: '14:00:00', field: 'Field 1', 'Gender': 'Girls',
        'Venue ID': 904,  'Field ID': 9001,
    },
    {
        'Age Group': 'U8 Girls', 'Home Team': 'Brooklyn Girls', 'Away Team': 'Woodstock Girls',
        date: '2026-06-13', time: '14:00:00', field: 'Field 2', 'Gender': 'Girls',
        'Venue ID': 904,  'Field ID': 9002,
    },
    {
        'Age Group': 'U8 Girls', 'Home Team': 'Thompson Girls', 'Away Team': 'Plainfield Girls 2',
        date: '2026-06-13', time: '14:00:00', field: 'Field 3', 'Gender': 'Girls',
        'Venue ID': 904,  'Field ID': 9003,
    },
    // U8 Boys
    {
        'Age Group': 'U8 Boys', 'Home Team': 'Canterbury Boys 1', 'Away Team': 'Canterbury Boys 2',
        date: '2026-06-13', time: '14:00:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 904,  'Field ID': 9001,
    },
    {
        'Age Group': 'U8 Boys', 'Home Team': 'Plainfield Boys 2', 'Away Team': 'Woodstock Boys 2',
        date: '2026-06-13', time: '14:00:00', field: 'Field 2', 'Gender': 'Boys',
        'Venue ID': 904,  'Field ID': 9002,
    },
    {
        'Age Group': 'U8 Boys', 'Home Team': 'Putnam Boys 2', 'Away Team': 'Thompson Boys',
        date: '2026-06-13', time: '14:00:00', field: 'Field 3', 'Gender': 'Boys',
        'Venue ID': 904,  'Field ID': 9003,
    },
    // U10 Girls
    {
        'Age Group': 'U10 Girls', 'Home Team': 'Putnam Girls', 'Away Team': 'Killingly Girls',
        date: '2026-06-13', time: '10:45:00', field: 'Field 1', 'Gender': 'Girls',
        'Venue ID': 904,  'Field ID': 9001,
    },
    {
        'Age Group': 'U10 Girls', 'Home Team': 'Brooklyn Girls 1', 'Away Team': 'Brooklyn Girls 2',
        date: '2026-06-13', time: '10:45:00', field: 'Field 2', 'Gender': 'Girls',
        'Venue ID': 904,  'Field ID': 9002,
    },
    // U12 Girls
    {
        'Age Group': 'U12 Girls', 'Home Team': 'Killingly Girls', 'Away Team': 'Putnam Girls',
        date: '2026-06-13', time: '09:00:00', field: 'Field 1', 'Gender': 'Girls',
        'Venue ID': 1072, 'Field ID': 9006,
    },
    {
        'Age Group': 'U12 Girls', 'Home Team': 'Pomfret Girls', 'Away Team': 'Brooklyn Girls',
        date: '2026-06-13', time: '10:30:00', field: 'Field 1', 'Gender': 'Girls',
        'Venue ID': 1072, 'Field ID': 9006,
    },
    // U12 Boys
    {
        'Age Group': 'U12 Boys', 'Home Team': 'Brooklyn Boys', 'Away Team': 'Woodstock Boys 1',
        date: '2026-06-13', time: '09:00:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 812,  'Field ID': 9007,
    },
    {
        'Age Group': 'U12 Boys', 'Home Team': 'Putnam Boys 2', 'Away Team': 'Plainfield Boys 2',
        date: '2026-06-13', time: '10:30:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 812,  'Field ID': 9007,
    },

    // ── Jun 14 (Saturday) ────────────────────────────────────────────────
    // U19 Coed (NEW 4.13.26)
    {
        'Age Group': 'U19 Coed', 'Home Team': 'NECONN U19 Team 1', 'Away Team': 'NECONN U19 Team 3',
        date: '2026-06-14', time: '15:00:00', field: 'Field 1', 'Gender': 'Coed',
        'Venue ID': 914,  'Field ID': 9008, notes: 'NEW 4.13.26 — team names TBD',
    },
    // U10 Boys (NEW 4.13.26)
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Gomes', 'Away Team': 'CWSA',
        date: '2026-06-14', time: '11:30:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 910,  'Field ID': 9009, notes: 'NEW 4.13.26',
    },

    // ── Jun 20 (Friday) ──────────────────────────────────────────────────
    // U10 Boys (NEW 4.13.26)
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Gomes', 'Away Team': 'Lebanon',
        date: '2026-06-20', time: '12:00:00', field: 'Field 1', 'Gender': 'Boys',
        'Venue ID': 910,  'Field ID': 9009, notes: 'NEW 4.13.26',
    },
];

const records = GAMES.map(g => ({
    ...g,
    'Source Club': 'NECONN',
    game_type:     'Rec',
    'Game Status': 'Unassigned',
    'Uploaded By': 'seed-neconn-june-6',
}));

console.log(`\nPrepared ${records.length} NECONN games — June 6 weekend + through Jun 20`);
console.log('\nGame list:');
records.forEach((g, i) => {
    const flag = g.notes ? `  ⚑ ${g.notes}` : '';
    console.log(`  ${String(i + 1).padStart(2)}. [${g['Age Group'].padEnd(11)}] ${g['Home Team'].padEnd(24)} vs ${g['Away Team'].padEnd(24)} — ${g.date} ${g.time.slice(0,5)} ${g.field}${flag}`);
});

if (DRY_RUN) {
    console.log('\n-- DRY RUN -- no data written\n');
    process.exit(0);
}

console.log('\nInserting...');
const { error } = await db.from('games').insert(records);
if (error) {
    console.error('\nINSERT ERROR:', error.message);
    process.exit(1);
}

console.log(`\nDone. ${records.length} NECONN games inserted.\n`);
