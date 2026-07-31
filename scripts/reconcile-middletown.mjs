import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'James Adu',             email: 'jcadu4@yahoo.com',           phone: '8608076359', age: 18, ca: '35207', city: 'Middletown', state: 'CT' },
  { name: 'Sal Bafumi',            email: 'sbafumi09@icloud.com',       phone: '8603011353', age: 17, ca: '39865', city: 'Middletown', state: 'CT' },
  { name: 'Geoffrey Canales',      email: 'gcanales456@gmail.com',      phone: '2038436235', age: 33, ca: '40305', city: 'Middletown', state: 'CT' },
  { name: 'Jacob Carlson',         email: 'jacreferee@gmail.com',       phone: '8602623423', age: 18, ca: '31647', city: 'Middletown', state: 'CT' },
  { name: 'Melissa Carrubba',      email: 'mcarrubbian@gmail.com',      phone: '2033768264', age: 30, ca: '37571', city: 'Middletown', state: 'CT' },
  { name: 'Salvatore Dimauro',     email: 'showtimesald7@gmail.com',    phone: '8603019829', age: 61, ca: '29858', city: 'Middletown', state: 'CT' },
  { name: 'Colin Fletcher',        email: 'coachcolin@att.net',         phone: '8607598985', age: 57, ca: '29628', city: 'Middletown', state: 'CT' },
  { name: 'Charles Fowler',        email: 'charleslfowler2@gmail.com',  phone: '8605606518', age: 14, ca: '39999', city: 'Middletown', state: 'CT' },
  { name: 'Will Fowler',           email: 'willffowler@gmail.com',      phone: '8605603717', age: 17, ca: '38569', city: 'Middletown', state: 'CT' },
  { name: 'Senghak Lim',           email: 'senghaklim24@gmail.com',     phone: '8607762163', age: 17, ca: '39984', city: 'Middletown', state: 'CT' },
  { name: 'Maya Martin',           email: 'maya.martin.150@gmail.com',  phone: '8603773795', age: 16, ca: '38232', city: 'Middletown', state: 'CT' },
  { name: 'Olli Muniz',            email: 'olli.valtteri06@gmail.com',  phone: '7328582221', age: 21, ca: '40094', city: 'Middletown', state: 'NJ' },
  { name: 'Orlando Rivera-anglero',email: 'oriveraanglero@yahoo.com',   phone: '7876914536', age: 48, ca: '29271', city: 'Middletown', state: 'CT' },
  { name: 'Carter Tarry',          email: 'ctarry113@gmail.com',        phone: '8603016743', age: 19, ca: '40871', city: 'Middletown', state: 'CT' },
];

let tagged = 0, added = 0;
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: r.city, state: r.state, 'Central Assign ID': r.ca }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id} (CA ${r.ca})`); tagged++;
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: r.city, state: r.state, age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: 'Added from Central Assign 2026-07-28' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id} (CA ${r.ca})`); added++;
  }
}
console.log(`\nMiddletown: ${tagged} tagged, ${added} added.`);
