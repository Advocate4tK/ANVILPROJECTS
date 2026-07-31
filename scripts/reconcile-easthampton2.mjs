import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Gavin Lynch',        email: 'gavinlynch843@gmail.com',        phone: '8607752506', age: 14, ca: '39890', city: 'East Hampton', state: 'CT' },
  { name: 'Charlie Montalbano', email: 'tracy.poppe@gmail.com',          phone: '8608782825', age: 14, ca: '39892', city: 'East Hampton', state: 'CT' },
  { name: 'Chase Palmer',       email: 'palmerchase3@gmail.com',         phone: '8607290280', age: 17, ca: '34648', city: 'East Hampton', state: 'CT' },
  { name: 'Daniel Peters',      email: 'danp17@yahoo.com',               phone: '4133875105', age: 49, ca: '4876',  city: 'Northampton',  state: 'MA' },
  { name: 'Lachlan Plante',     email: 'plantel0304@gmail.com',          phone: '8607599994', age: 15, ca: '39538', city: 'East Hampton', state: 'CT' },
  { name: 'Jonathan Quealy',    email: 'jwquealy@gmail.com',             phone: null,         age: 43, ca: '40399', city: 'East Hampton', state: 'CT' },
  { name: 'Stephen Quealy',     email: 'spquealy@gmail.com',             phone: '8609675830', age: 13, ca: '40583', city: 'East Hampton', state: 'CT' },
  { name: 'Alexandre Rodrigues',email: 'alexandrelrodrigues8@gmail.com', phone: '8604940652', age: 17, ca: '40522', city: 'East Hampton', state: 'CT' },
  { name: 'Jackson Rurka',      email: 'jmrurka@gmail.com',              phone: '8609901821', age: 17, ca: '34644', city: 'East Hampton', state: 'CT' },
  { name: 'John Salafia',       email: 'jacksalafia9@gmail.com',         phone: '8609825054', age: 17, ca: '35206', city: 'East Hampton', state: 'CT' },
  { name: 'Cayden Schoonerman', email: 'caydenschoonerman@gmail.com',    phone: '8605102855', age: 16, ca: '40644', city: 'East Hampton', state: 'CT' },
  { name: 'Taylor Schoonerman', email: 'taylorschoonerman@icloud.com',   phone: '8608768136', age: 16, ca: '37750', city: 'East Hampton', state: 'CT' },
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
console.log(`\nEast Hampton p2: ${tagged} tagged, ${added} added.`);
