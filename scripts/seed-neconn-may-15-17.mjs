/**
 * seed-neconn-may-15-17.mjs
 *
 * Imports NECONN May 15-17 2026 weekend games into the referee tool Supabase games table.
 * Source: D:/Docs n Files/TLS Share/ASSIGNOR/NECONN/May 15-17.xlsx
 *
 * 19 games:
 *  - 1 on May 15 (Friday U12 Girls)
 *  - 17 on May 16 (Saturday)
 *  - 1 on May 20 (U8 Girls rescheduled game)
 *
 * NOTE: U19 Coed team names unknown — using placeholders NECONN U19 Team 1 / Team 3
 * NOTE: U9 Boys uses actual names from schedule (Campbell vs RHAM)
 *
 * Run:     node scripts/seed-neconn-may-15-17.mjs
 * Dry run: node scripts/seed-neconn-may-15-17.mjs --dry-run
 */

import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');

const SUPABASE_URL = 'https://kaniccdqieyesezpousu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Venue IDs follow NECONN internal numbering (consistent with seed-neconn-spring-2026.mjs)
// 9001 = Old KHS    fields: F1=9001, F2=9002, F3=9003
// 9002 = Prince Hill           F1=9004, F2=9005
// 9003 = Riverside Park        F1=9006
// 9004 = Pomfret Rec           F1=9007
// 9005 = Rawson                F1=9008
// 9006 = WES (Woodstock Elem)  F1=9009  ← new this weekend

const GAMES = [
    // ── May 15 (Friday) ───────────────────────────────────────────────────
    {
        'Age Group': 'U12 Girls', 'Home Team': 'Plainfield Girls 2', 'Away Team': 'Pomfret Girls',
        date: '2026-05-15', time: '18:00:00', field: 'Field 1', division: 'Girls', 'Gender': 'Girls',
        'Venue ID': 9003, 'Field ID': 9006,
    },

    // ── May 16 (Saturday) ─────────────────────────────────────────────────
    // U8 Girls
    {
        'Age Group': 'U8 Girls', 'Home Team': 'Brooklyn Girls', 'Away Team': 'Putnam Girls',
        date: '2026-05-16', time: '13:00:00', field: 'Field 1', division: 'Girls', 'Gender': 'Girls',
        'Venue ID': 9001, 'Field ID': 9001,
    },
    // U8 Boys
    {
        'Age Group': 'U8 Boys', 'Home Team': 'Plainfield Boys 2', 'Away Team': 'Canterbury Boys 2',
        date: '2026-05-16', time: '13:00:00', field: 'Field 1', division: 'Boys', 'Gender': 'Boys',
        'Venue ID': 9001, 'Field ID': 9001,
    },
    {
        'Age Group': 'U8 Boys', 'Home Team': 'Canterbury Boys 1', 'Away Team': 'Killingly Boys 2',
        date: '2026-05-16', time: '14:00:00', field: 'Field 1', division: 'Boys', 'Gender': 'Boys',
        'Venue ID': 9001, 'Field ID': 9001,
    },
    {
        'Age Group': 'U8 Boys', 'Home Team': 'Thompson Boys', 'Away Team': 'Woodstock Boys 2',
        date: '2026-05-16', time: '14:00:00', field: 'Field 2', division: 'Boys', 'Gender': 'Boys',
        'Venue ID': 9001, 'Field ID': 9002,
    },
    // U10 Girls
    {
        'Age Group': 'U10 Girls', 'Home Team': 'Pomfret Girls', 'Away Team': 'Plainfield Girls 2',
        date: '2026-05-16', time: '11:45:00', field: 'Field 1', division: 'Girls', 'Gender': 'Girls',
        'Venue ID': 9001, 'Field ID': 9001,
    },
    {
        'Age Group': 'U10 Girls', 'Home Team': 'Putnam Girls', 'Away Team': 'Brooklyn Girls 2',
        date: '2026-05-16', time: '11:45:00', field: 'Field 2', division: 'Girls', 'Gender': 'Girls',
        'Venue ID': 9001, 'Field ID': 9002,
    },
    // U10 Boys
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Brooklyn Boys 2', 'Away Team': 'Woodstock Boys 2',
        date: '2026-05-16', time: '10:45:00', field: 'Field 1', division: 'Boys', 'Gender': 'Boys',
        'Venue ID': 9002, 'Field ID': 9004,
    },
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Killingly Boys 1', 'Away Team': 'Woodstock Boys 1',
        date: '2026-05-16', time: '10:45:00', field: 'Field 2', division: 'Boys', 'Gender': 'Boys',
        'Venue ID': 9002, 'Field ID': 9005,
    },
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Killingly Boys 2', 'Away Team': 'Putnam Boys',
        date: '2026-05-16', time: '12:00:00', field: 'Field 1', division: 'Boys', 'Gender': 'Boys',
        'Venue ID': 9002, 'Field ID': 9004,
    },
    {
        'Age Group': 'U10 Boys', 'Home Team': 'Pomfret Boys', 'Away Team': 'Thompson Boys',
        date: '2026-05-16', time: '10:45:00', field: 'Field 3', division: 'Boys', 'Gender': 'Boys',
        'Venue ID': 9001, 'Field ID': 9003,
    },
    // U12 Girls
    {
        'Age Group': 'U12 Girls', 'Home Team': 'Putnam Girls', 'Away Team': 'Plainfield Girls 1',
        date: '2026-05-16', time: '09:00:00', field: 'Field 1', division: 'Girls', 'Gender': 'Girls',
        'Venue ID': 9003, 'Field ID': 9006,
    },
    {
        'Age Group': 'U12 Girls', 'Home Team': 'Brooklyn Girls', 'Away Team': 'Killingly Girls',
        date: '2026-05-16', time: '10:30:00', field: 'Field 1', division: 'Girls', 'Gender': 'Girls',
        'Venue ID': 9003, 'Field ID': 9006,
    },
    // U12 Boys
    {
        'Age Group': 'U12 Boys', 'Home Team': 'Brooklyn Boys', 'Away Team': 'Putnam Boys 2',
        date: '2026-05-16', time: '09:00:00', field: 'Field 1', division: 'Boys', 'Gender': 'Boys',
        'Venue ID': 9004, 'Field ID': 9007,
    },
    {
        'Age Group': 'U12 Boys', 'Home Team': 'Killingly Boys', 'Away Team': 'Putnam Boys 1',
        date: '2026-05-16', time: '10:30:00', field: 'Field 1', division: 'Boys', 'Gender': 'Boys',
        'Venue ID': 9004, 'Field ID': 9007,
    },
    // U15 Coed
    {
        'Age Group': 'U15 Coed', 'Home Team': 'Killingly', 'Away Team': 'Pomfret',
        date: '2026-05-16', time: '12:30:00', field: 'Field 1', division: 'Coed', 'Gender': 'Coed',
        'Venue ID': 9005, 'Field ID': 9008,
    },
    // U19 Coed (NEW 4.13.26 — team names unknown, placeholders)
    {
        'Age Group': 'U19 Coed', 'Home Team': 'NECONN U19 Team 1', 'Away Team': 'NECONN U19 Team 3',
        date: '2026-05-16', time: '15:00:00', field: 'Field 1', division: 'Coed', 'Gender': 'Coed',
        'Venue ID': 9005, 'Field ID': 9008, notes: 'NEW division 4.13.26 — team names TBD',
    },
    // U9 Boys (NEW 4.13.26 — actual team names from schedule)
    {
        'Age Group': 'U9 Boys', 'Home Team': 'Campbell', 'Away Team': 'RHAM',
        date: '2026-05-16', time: '15:00:00', field: 'Field 1', division: 'Boys', 'Gender': 'Boys',
        'Venue ID': 9006, 'Field ID': 9009, notes: 'NEW 4.13.26',
    },

    // ── May 20 (Wednesday — rescheduled from this weekend) ────────────────
    {
        'Age Group': 'U8 Girls', 'Home Team': 'Killingly Girls', 'Away Team': 'Pomfret Girls',
        date: '2026-05-20', time: '17:30:00', field: 'Field 2', division: 'Girls', 'Gender': 'Girls',
        'Venue ID': 9001, 'Field ID': 9002, notes: 'Rescheduled — new date 4.29.26',
    },
];

const records = GAMES.map(g => ({
    ...g,
    'Source Club': 'NECONN',
    'game_type':   'Rec',
    'Game Status': 'Unassigned',
    'Uploaded By': 'seed-neconn-may-15-17',
}));

console.log(`\nPrepared ${records.length} NECONN games for May 15-17 weekend`);
console.log('\nGame list:');
records.forEach((g, i) => {
    const flagged = g.notes ? `  ⚑ ${g.notes}` : '';
    console.log(`  ${String(i + 1).padStart(2)}. [${g['Age Group'].padEnd(11)}] ${g['Home Team'].padEnd(22)} vs ${g['Away Team'].padEnd(22)} — ${g.date} ${g.time.slice(0,5)} ${g.field}${flagged}`);
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

console.log(`Done. ${records.length} NECONN games inserted.\n`);
