import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const IDS = [1131, 1269, 1402, 2449, 2450, 2451, 2452, 2453, 2454, 2455, 2456, 2459];

// 1. Back up the full rows first (restorable)
const { data: rows, error: rErr } = await db.from('referees').select('*').in('id', IDS);
if (rErr) { console.log('Backup read failed:', rErr.message); process.exit(1); }
writeFileSync('scripts/deleted-refs-backup.json', JSON.stringify(rows, null, 2));
console.log(`Backed up ${rows.length} rows → scripts/deleted-refs-backup.json`);
rows.forEach(r => console.log(`  #${r.id} ${r.name} (${r.email || '-'})`));

// 2. Delete (pool_members cascade automatically)
const { error: dErr } = await db.from('referees').delete().in('id', IDS);
if (dErr) { console.log('DELETE failed:', dErr.message); process.exit(1); }

// 3. Confirm gone
const { data: check } = await db.from('referees').select('id').in('id', IDS);
console.log(`\nDeleted. Remaining of those ids: ${check ? check.length : '?'} (should be 0)`);
