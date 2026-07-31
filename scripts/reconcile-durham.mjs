import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Ryan Aingworth',    email: 'ryanaingworth13@gmail.com',     phone: '2037459276', age: 13, ca: '40997' },
  { name: 'Allison Booth',     email: 'alliecatbooth@gmail.com',       phone: '8608768146', age: 17, ca: '35055' },
  { name: 'David Booth',       email: 'dmbooth@sbcglobal.net',         phone: '2033142030', age: 47, ca: '26688' },
  { name: 'Rebecca Booth',     email: 'rebaboo19@gmail.com',           phone: '2033142030', age: 15, ca: '38230' },
  { name: 'John Bugai',        email: 'jbugai@aol.com',                phone: '8607592551', age: 64, ca: '1858'  },
  { name: 'Ray Castro',        email: 'ray_castro29@icloud.com',       phone: null,         age: 14, ca: '39326' },
  { name: 'Andrew Crocker',    email: 'ajcblue29@gmail.com',           phone: '8608192438', age: 15, ca: '38389' },
  { name: 'Evelyn Crocker',    email: 'evelyngracecrocker@gmail.com',  phone: '8604907135', age: 15, ca: '38400' },
  { name: 'Phinnaeus Dreyfus', email: 'pdreyfus29@gmail.com',          phone: '7037282666', age: 15, ca: '38413' },
  { name: 'Julia Hahn',        email: 'julia.hahn1316@gmail.com',      phone: '9592315331', age: 15, ca: '40547' },
  { name: 'Thomas Helenski',   email: 'thomasjameshelenski@gmail.com', phone: '8603160399', age: 17, ca: '37782' },
  { name: 'Joshua Luca',       email: 'jrluca21@gmail.com',            phone: '8609757329', age: 15, ca: '38860' },
];

let tagged = 0, added = 0;
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'Durham', state: 'CT', 'Central Assign ID': r.ca }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id} (CA ${r.ca})`); tagged++;
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'Durham', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: 'Added from Central Assign 2026-07-29' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id} (CA ${r.ca})`); added++;
  }
}
console.log(`\nDurham: ${tagged} tagged, ${added} added.`);
