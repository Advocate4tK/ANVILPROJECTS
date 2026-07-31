import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const { data, error } = await db.from('referees').select('*');
if (error) { console.log('Error:', error.message); process.exit(1); }

const has = v => v != null && String(v).trim() !== '';
const total = data.length;
const realName = data.filter(r => has(r.name) && isNaN(String(r.name).trim()));

const email  = realName.filter(r => has(r.email) || has(r['Email 2']) || has(r['Email 3']));
const phone  = realName.filter(r => has(r.phone));
const both   = realName.filter(r => (has(r.email) || has(r['Email 2']) || has(r['Email 3'])) && has(r.phone));
const cert   = realName.filter(r => has(r['Certification Level']));
const clubs  = realName.filter(r => has(r.clubs));

console.log(`Total rows:            ${total}`);
console.log(`Real-name refs:        ${realName.length}`);
console.log(`  with an email:       ${email.length}`);
console.log(`  with a phone:        ${phone.length}`);
console.log(`  with BOTH:           ${both.length}`);
console.log(`  with cert level:     ${cert.length}`);
console.log(`  with a club tag:     ${clubs.length}`);

// distinct club tags (to gauge whether we can already segment into pools)
const clubTags = {};
realName.forEach(r => { const c = (r.clubs || '').toString().trim(); if (c) clubTags[c] = (clubTags[c]||0)+1; });
console.log(`\nClub tags present (${Object.keys(clubTags).length}):`);
Object.entries(clubTags).sort((a,b)=>b[1]-a[1]).slice(0,25).forEach(([c,n]) => console.log(`  ${n.toString().padStart(4)}  ${c}`));
