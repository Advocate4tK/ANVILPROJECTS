import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');
const { data, error } = await db.from('referees')
    .select('id, name, "Certification Level", "Years Reffing", "Age Groups Preferred", status')
    .not('name', 'is', null)
    .neq('name', '')
    .order('name');
if (error) { console.log('Error:', error.message); process.exit(1); }
// Filter to refs with real names (not just numbers)
const real = data.filter(r => r.name && isNaN(r.name.trim()));
console.log(`Refs with real names: ${real.length}`);
real.slice(0, 30).forEach(r =>
    console.log(` id=${r.id} | ${r.name} | ${r['Certification Level'] || '—'} | ${r['Years Reffing'] || '—'} yrs | ${r['Age Groups Preferred'] || '—'} | ${r.status || '—'}`)
);
