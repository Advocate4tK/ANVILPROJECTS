import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Shawn Cervera',        email: 'scmedic121@yahoo.com',       phone: '8604609342', age: 52, ca: '31493' },
  { name: 'Hayden Fink',          email: 'haydenjohn.fink@gmail.com',  phone: '3038702908', age: 14, ca: '39586' },
  { name: 'Ryan Fink',            email: 'ryan.fink21@gmail.com',      phone: '3038702908', age: 41, ca: '37840' },
  { name: 'Nathan Hill',          email: 'goldendiamondtrophy@gmail.com', phone: '3472398735', age: 15, ca: '39891' },
  { name: 'Xavier Lee',           email: 'xavlee324@gmail.com',        phone: '8602151408', age: 15, ca: '39411' },
  { name: 'Dennis Mazorra',       email: 'ddmc1488@gmail.com',         phone: '8622533232', age: 38, ca: '40336' },
  { name: 'Edgar Pina Rodriguez', email: 'alexpina082009@gmail.com',   phone: '8604603884', age: 16, ca: '39062' },
  { name: 'Dexter Smith',         email: 'dextercoopersmith@gmail.com',phone: '8604493810', age: 15, ca: '39177' },
  { name: 'Levi Steinhaus',       email: 'lpsteinhaus@gmail.com',      phone: '8603735452', age: 17, ca: '37836' },
];

let tagged = 0, added = 0;
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'Waterford', state: 'CT', 'Central Assign ID': r.ca }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id} (CA ${r.ca})`); tagged++;
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'Waterford', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: 'Added from Central Assign 2026-07-28' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id} (CA ${r.ca})`); added++;
  }
}
console.log(`\nWaterford: ${tagged} tagged, ${added} added (Griswold territory — not pooled).`);
