/**
 * seed-glastonbury-2026-refs.mjs
 *
 * Imports referees from the Glastonbury Hartwell 2026 signup sheet into
 * the referee tool Supabase referees + availability tables.
 *
 * Source: TOURNAMENT/Glast 26/Ref - master signup sheet.xlsx
 *
 * Run:      node scripts/seed-glastonbury-2026-refs.mjs
 * Dry run:  node scripts/seed-glastonbury-2026-refs.mjs --dry-run
 */

import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

const SUPABASE_URL = 'https://kaniccdqieyesezpousu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';
const XLSX_PATH    = path.resolve(__dirname, '../TOURNAMENT/Glast 26/Ref - master signup sheet.xlsx');

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Tournament dates ──────────────────────────────────────────────────────
const FRI  = '2026-04-24';
const SAT  = '2026-04-25';
const SUN  = '2026-04-26';

// ── Site code → full venue name ───────────────────────────────────────────
const SITE_MAP = {
    'add':   'Addison',
    'ghs':   'GHS',
    'vet':   'Veterans',
    'buck':  'Buckingham',
    'nay':   'Nayaug',
    'mag':   'Magnet',
    'riv':   'Riverside Park',
    'heb':   'Hebron Ave',
    'co':    'CO',
    'irish': 'Irish',
    'rot':   'Rotary',
};

// ── Parse availability cell ───────────────────────────────────────────────
// Returns { available, startTime, endTime, preferredLocation }
// available = true | false | null (blank)
function parseAvail(raw) {
    if (raw === null || raw === undefined || raw === '') return null; // skip blank
    const s = raw.toString().trim().toLowerCase();

    if (s === 'no' || s === 'n') return { available: false };
    if (s === 'yes' || s === 'y') return { available: true };

    // Time constraint: >930, >10, >1030, >11, >1130, >12, >2 etc.
    const afterMatch = s.match(/^>(\d+)$/);
    if (afterMatch) {
        const raw = afterMatch[1];
        const startTime = parseTimeCode(raw);
        return { available: true, startTime };
    }

    // Time constraint: <1, <2, <3, <5 (available UNTIL that hour)
    const beforeMatch = s.match(/^<(\d+)$/);
    if (beforeMatch) {
        const h = parseInt(beforeMatch[1], 10);
        const endHour = h < 8 ? h + 12 : h; // <1 = 13:00, <2 = 14:00, <3 = 15:00, <5 = 17:00
        return { available: true, endTime: `${String(endHour).padStart(2,'0')}:00` };
    }

    // Site code
    const site = SITE_MAP[s];
    if (site) return { available: true, preferredLocation: site };

    // Unknown value — treat as available with note
    return { available: true, notes: raw.toString().trim() };
}

// Parse time code like "930" → "09:30", "10" → "10:00", "1030" → "10:30", "1130" → "11:30"
function parseTimeCode(code) {
    if (code.length <= 2) {
        // Single or double digit hour
        const h = parseInt(code, 10);
        return `${String(h).padStart(2,'0')}:00`;
    }
    if (code.length === 3) {
        // e.g. "930" → 9:30
        const h = parseInt(code[0], 10);
        const m = parseInt(code.slice(1), 10);
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }
    if (code.length === 4) {
        // e.g. "1030" → 10:30
        const h = parseInt(code.slice(0,2), 10);
        const m = parseInt(code.slice(2), 10);
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }
    return null;
}

// "Last, First" → "First Last"
function normalizeName(raw) {
    if (!raw) return null;
    const s = raw.toString().trim();
    const commaIdx = s.indexOf(',');
    if (commaIdx === -1) return s;
    const last  = s.slice(0, commaIdx).trim();
    const first = s.slice(commaIdx + 1).trim();
    return `${first} ${last}`;
}

// Excel serial DOB → ISO date string
function excelDOBtoISO(val) {
    if (!val) return null;
    if (typeof val === 'number') {
        const d = new Date((val - 25569) * 86400 * 1000);
        return d.toISOString().slice(0, 10);
    }
    // Already a string like "02/29/1952"
    const s = val.toString().trim();
    if (s.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [m, d, y] = s.split('/');
        return `${y}-${m}-${d}`;
    }
    return null;
}

// ── Load spreadsheet ──────────────────────────────────────────────────────
const wb   = XLSX.readFile(XLSX_PATH);
const ws   = wb.Sheets['Sheet1'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Col indices (0-based):
// 0=row#, 1=Name, 2=RegNum, 3=Gender, 4=DOB, 5=RegDate, 6=Email, 7=Phone,
// 8=SubmitName, 9=SubmitEmail, 10=SubmitPhone, 11=Street, 12=Street2,
// 13=City, 14=State, 15=ZIP, 16=PriorTourney, 17=SatGames, 18=CertYear,
// 19=SunGames, 20=AgeGroup, 21=Position, 22=FriNight, 23=SatMorn,
// 24=SatAftern, 25=SunMorn, 26=SunAftern, 27=PayPal, 28=Conflicts,
// 29=SpecialReqs, 30=College, 31=ReturnTeam, 32=PrevGroup, 33=PrevUniform,
// 34=TotalGames, 35=CenterRef

const refRecords = [];
const availRecords = []; // will be populated after refs are inserted

// Row 0 = headers, row 1 = Goldstein placeholder (no reg number, skip)
const dataRows = rows.slice(1).filter(r => r[1] && r[1].toString().trim() && r[6] && r[6].toString().trim());

console.log(`Found ${dataRows.length} refs with names + emails`);

// Also catch refs with name but no email (warn)
const noEmail = rows.slice(1).filter(r => r[1] && r[1].toString().trim() && (!r[6] || !r[6].toString().trim()));
if (noEmail.length) {
    console.warn(`WARNING: ${noEmail.length} refs have no email (will be skipped for dedup but still imported):`);
    noEmail.forEach(r => console.warn(`  ${r[1]}`));
}

const allDataRows = rows.slice(1).filter(r => r[1] && r[1].toString().trim());
console.log(`Total refs with names: ${allDataRows.length}`);

for (const r of allDataRows) {
    const name   = normalizeName(r[1]);
    const email  = r[6]?.toString().trim() || null;
    const phone  = r[7]?.toString().trim() || null;
    const dob    = excelDOBtoISO(r[4]);
    const gender = r[3]?.toString().trim() || null;
    const street = r[11]?.toString().trim() || null;
    const city   = r[13]?.toString().trim() || null;
    const state  = r[14]?.toString().trim() || null;
    const zipRaw = r[15]?.toString().trim() || '';
    const zip    = zipRaw ? (parseInt(zipRaw, 10) || null) : null;
    const prior  = r[16]?.toString().trim() || '';
    const satReq = r[17]?.toString().trim() || null;
    const sunReq = r[19]?.toString().trim() || null;
    const ageGrp = r[20]?.toString().trim() || null;
    const pos    = r[21]?.toString().trim() || null;
    const paypal = r[27]?.toString().trim() || null;
    const conflicts = r[28]?.toString().trim() || null;
    const specReqs  = r[29]?.toString().trim() || null;
    const college   = r[30]?.toString().trim()?.toLowerCase();
    const totalGamesRaw = r[34]?.toString().trim() || '';
    const totalGames = totalGamesRaw ? (parseInt(totalGamesRaw, 10) || null) : null;
    const regNumRaw = r[2]?.toString().trim() || '';
    const regNum = regNumRaw ? (parseInt(regNumRaw, 10) || null) : null;
    const certYear = r[18]?.toString().trim() || null;

    // Build notes blob
    const noteParts = [];
    if (prior.toLowerCase() === 'yes') noteParts.push('Returning tournament referee');
    if (college === 'yes') noteParts.push('College student');
    if (paypal) noteParts.push(`PayPal: ${paypal}`);
    if (conflicts && conflicts.toLowerCase() !== 'n/a' && conflicts.toLowerCase() !== 'none') noteParts.push(`Conflicts: ${conflicts}`);
    if (specReqs && specReqs.toLowerCase() !== 'n/a' && specReqs.toLowerCase() !== 'none') noteParts.push(`Requests: ${specReqs}`);
    if (certYear) noteParts.push(`Cert year: ${certYear}`);
    noteParts.push('Source: Glastonbury 2026 signup');

    refRecords.push({
        name,
        email,
        phone,
        'Date of Birth':        dob,
        'Gender':               gender,
        'address':              street,
        'city':                 city,
        'state':                state,
        'Zip Code':             zip,
        'Age Groups Preferred': ageGrp,
        'Certification Level':  pos,
        'Years Reffing':        certYear || null,
        'Central Assign ID':    regNum,
        'games':                totalGames,
        'notes':                noteParts.join(' | ') || null,
        'source_club':          'GLASTONBURY',
        // stash availability raw for post-insert wiring
        _fri:  r[22],
        _satM: r[23],
        _satA: r[24],
        _sunM: r[25],
        _sunA: r[26],
        _satReq: satReq,
        _sunReq: sunReq,
    });
}

// ── Preview ───────────────────────────────────────────────────────────────
console.log('\nFirst 5 refs:');
refRecords.slice(0, 5).forEach(r => {
    console.log(`  ${r.name} | ${r.email} | ${r['Age Groups Preferred']} | ${r['Certification Level']}`);
    console.log(`    Fri=${r._fri} | SatM=${r._satM} | SatA=${r._satA} | SunM=${r._sunM} | SunA=${r._sunA}`);
});

if (DRY_RUN) {
    console.log('\n-- DRY RUN -- no data written');
    process.exit(0);
}

// ── Insert refs ───────────────────────────────────────────────────────────
// Strip private _ fields before insert
const insertRefs = refRecords.map(r => {
    const { _fri, _satM, _satA, _sunM, _sunA, _satReq, _sunReq, ...clean } = r;
    return clean;
});

const BATCH = 50;
let inserted = 0;
const insertedIds = []; // [{ id, name, _fri, _satM, ... }]

console.log('\nInserting refs...');
for (let i = 0; i < insertRefs.length; i += BATCH) {
    const batch = insertRefs.slice(i, i + BATCH);
    const { data, error } = await db.from('referees').insert(batch).select('id, name, email');
    if (error) {
        console.error(`Ref batch ${Math.floor(i/BATCH)+1} ERROR:`, error.message);
        process.exit(1);
    }
    // Pair returned IDs with original records (same order)
    data.forEach((row, j) => {
        const orig = refRecords[i + j];
        insertedIds.push({ id: row.id, name: row.name, ...orig });
    });
    inserted += batch.length;
    console.log(`  Refs inserted: ${inserted}/${insertRefs.length}`);
}

// ── Build availability rows ───────────────────────────────────────────────
const SESSIONS = [
    { field: '_fri',  date: FRI, label: 'Friday night' },
    { field: '_satM', date: SAT, label: 'Saturday morning' },
    { field: '_satA', date: SAT, label: 'Saturday afternoon' },
    { field: '_sunM', date: SUN, label: 'Sunday morning' },
    { field: '_sunA', date: SUN, label: 'Sunday afternoon' },
];

const availRows = [];
for (const ref of insertedIds) {
    for (const session of SESSIONS) {
        const parsed = parseAvail(ref[session.field]);
        if (parsed === null) continue; // blank — skip

        const row = {
            referee_id:           ref.id,
            'Referee Name':       ref.name,
            'Referee Email':      ref.email,
            date:                 session.date,
            available:            parsed.available,
            'Start Time':         parsed.startTime  || null,
            'End Time':           parsed.endTime    || null,
            'Preferred Locations': parsed.preferredLocation || null,
            'Positions Willing to Work': ref['Certification Level'] || null,
            'Age Groups Preferred':      ref['Age Groups Preferred'] || null,
            notes:                (parsed.notes ? `${session.label}: ${parsed.notes}` : session.label),
            'Max Games':          null,
        };
        availRows.push(row);
    }
}

console.log(`\nBuilt ${availRows.length} availability rows`);

// Insert availability
let availInserted = 0;
for (let i = 0; i < availRows.length; i += BATCH) {
    const batch = availRows.slice(i, i + BATCH);
    const { error } = await db.from('availability').insert(batch);
    if (error) {
        console.error(`Avail batch ${Math.floor(i/BATCH)+1} ERROR:`, error.message);
        process.exit(1);
    }
    availInserted += batch.length;
    console.log(`  Availability inserted: ${availInserted}/${availRows.length}`);
}

console.log(`\nDone.`);
console.log(`  ${inserted} refs inserted`);
console.log(`  ${availInserted} availability rows inserted`);
console.log(`  ${refRecords.length - inserted} skipped`);
