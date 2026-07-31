import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const { data, error } = await db.from('referees').select('id, name, email, phone, city, created_at').order('id');
if (error) { console.log('Error:', error.message); process.exit(1); }

// Named by Tod
const named = [1402, 1131, 1269];
// Heuristics for fake/test rows
const fakePhone = r => /555[\s\-]?12(12|34)|555[\s\-]?\d{4}/.test(String(r.phone||''));
const seussy = r => /louhoo|whoville|test|sample|example|demo/i.test(`${r.name||''} ${r.email||''}`);

const suspects = data.filter(r =>
    named.includes(r.id) || fakePhone(r) || seussy(r)
);
console.log(`Suspect rows: ${suspects.length}`);
suspects.forEach(r => console.log(`  #${r.id} | ${r.name} | ${r.phone||'-'} | ${r.email||'-'} | ${r.city||'-'} | added ${r.created_at||'?'}`));

// also show created_at clustering (test batches often share a timestamp)
const byDay = {};
data.forEach(r => { const d=(r.created_at||'').slice(0,10); byDay[d]=(byDay[d]||0)+1; });
console.log('\ncreated_at by day (top):');
Object.entries(byDay).sort((a,b)=>b[1]-a[1]).slice(0,6).forEach(([d,n])=>console.log(`  ${d}: ${n}`));
