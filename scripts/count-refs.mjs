import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');
const { data, error } = await db.from('referees').select('id, name, status, "Certification Level"').order('name');
if (error) { console.log('Error:', error.message); process.exit(1); }
console.log(`Total refs in DB: ${data.length}`);
data.slice(0, 10).forEach(r => console.log(` - ${r.name} | ${r['Certification Level'] || 'no cert'} | ${r.status || 'no status'}`));
