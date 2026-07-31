import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Joseph Aresco',        email: 'joe@arescoconstruction.com', phone: '8608839706', age: 55, ca: '30574' },
  { name: 'Sal Corsino',          email: 'salsocref@gmail.com',        phone: '8606704320', age: 67, ca: '862'   },
  { name: 'Nathaniel Dietrichsen',email: 'natedietrichsen@gmail.com',  phone: '8608949960', age: 17, ca: '35398' },
  { name: 'Evan May',             email: 'evanrmay09@icloud.com',      phone: '8605385344', age: 17, ca: '35427' },
  { name: 'Derek Mazzullo',       email: 'brmazzullo@icloud.com',      phone: '7046048287', age: 14, ca: '40203' },
  { name: 'Teodora Rotaru',       email: 'teo.rotaru15@gmail.com',     phone: '8607965618', age: 50, ca: '40849' },
  { name: 'Misha Sanborn',        email: 'm_sandz11@icloud.com',       phone: null,         age: 15, ca: '40914' },
  { name: 'Lena Trojanowski',     email: 'ltrojanowski28@mercyhigh.com',phone: '8605532945',age: 16, ca: '39030' },
  { name: 'Remy Wilson',          email: 'remyw10@icloud.com',         phone: '8605108735', age: 17, ca: '35426' },
  { name: 'Evan Yardis',          email: 'yardise2003@yahoo.com',      phone: '8602503420', age: 43, ca: '39666' },
];

let tagged = 0, added = 0;
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'Portland', state: 'CT', 'Central Assign ID': r.ca }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id} (CA ${r.ca})`); tagged++;
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'Portland', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: 'Added from Central Assign 2026-07-29' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id} (CA ${r.ca})`); added++;
  }
}
console.log(`\nPortland: ${tagged} tagged, ${added} added.`);
