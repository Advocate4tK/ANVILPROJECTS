import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

// 1. Snapshot everyone currently marked NON-grassroots (so a real Regional is recoverable)
const { data: all, error: rErr } = await db.from('referees').select('id, name, "Certification Level"');
if (rErr) { console.log('Read failed:', rErr.message); process.exit(1); }
const norm = v => (v || '').trim().toLowerCase();
const nonGrass = all.filter(r => norm(r['Certification Level']) && norm(r['Certification Level']) !== 'grassroots');
writeFileSync('scripts/cert-backup.json', JSON.stringify(nonGrass, null, 2));
console.log(`Total refs: ${all.length}`);
console.log(`Were NON-grassroots (backed up → scripts/cert-backup.json): ${nonGrass.length}`);
const byVal = {};
nonGrass.forEach(r => { const v = (r['Certification Level']||'').trim(); byVal[v]=(byVal[v]||0)+1; });
Object.entries(byVal).forEach(([v,n]) => console.log(`  ${n} × "${v}"`));

// 2. Set everyone to Grassroots
const { error: uErr } = await db.from('referees').update({ 'Certification Level': 'Grassroots' }).gt('id', 0);
if (uErr) { console.log('UPDATE failed:', uErr.message); process.exit(1); }

// 3. Verify
const { data: after } = await db.from('referees').select('"Certification Level"');
const distinct = [...new Set((after||[]).map(r => r['Certification Level']))];
console.log(`\nAfter: distinct cert values = ${JSON.stringify(distinct)}`);
