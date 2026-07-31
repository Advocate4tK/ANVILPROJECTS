import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Yousef Ahmed',     email: 'yoyoyousefya11@gmail.com',    phone: '8609758119', age: 17, ca: '35391' },
  { name: 'Derek Barone',     email: 'derekbarone08@icloud.com',    phone: '8605755724', age: 17, ca: '34667' },
  { name: 'Kevin Barone',     email: 'kevinbarone25@gmail.com',     phone: '8603387819', age: 16, ca: '37541' },
  { name: 'Hunter Blackman',  email: 'hunterblackman@icloud.com',   phone: '8602143248', age: 13, ca: '40957' },
  { name: 'Jack Cotter',      email: 'jack.cotter@rhamschools.org', phone: '7347090705', age: 15, ca: '40964' },
  { name: 'Owen Cotter',      email: 'owen.cotter@rhamschools.org', phone: '7347090705', age: 13, ca: '40965' },
  { name: 'Brody Harl',       email: 'brodyharl@icloud.com',        phone: '8602353091', age: 16, ca: '37002' },
  { name: 'Gavin Knight',     email: 'gknight1843@gmail.com',       phone: '8603280068', age: 14, ca: '40911' },
  { name: 'Chase McLaughlin', email: 'mclchase9@gmail.com',         phone: '8607128878', age: 17, ca: '37542' },
  { name: 'Joseph Mirabal',   email: 'joeymirabal0924@gmail.com',   phone: '8603014634', age: 14, ca: '39548' },
  { name: 'Ariana Ramos',     email: 'ariana.r4@icloud.com',        phone: '8609182397', age: 15, ca: '38952' },
  { name: 'Edith Ranta',      email: 'edieranta@gmail.com',         phone: '9592370547', age: 14, ca: '39403' },
];

let tagged = 0, added = 0;
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'Marlborough', state: 'CT', 'Central Assign ID': r.ca }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id} (CA ${r.ca})`); tagged++;
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'Marlborough', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: 'Added from Central Assign 2026-07-28' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id} (CA ${r.ca})`); added++;
  }
}
console.log(`\nMarlborough: ${tagged} tagged, ${added} added (East Haddam area — not pooled).`);
