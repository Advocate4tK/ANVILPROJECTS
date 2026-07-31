import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Ava Chiappetta',    email: 'achipers12345@yahoo.com',    phone: '8608769907', age: 16, ca: '40163' },
  { name: 'Leah Ekblade',      email: 'eekblade@yahoo.com',         phone: '8609299972', age: 15, ca: '39563' },
  { name: 'Rowen Ferretti',    email: 'rowenferretti@gmail.com',    phone: '8608348841', age: 16, ca: '40460' },
  { name: 'Brayden Fraschilla',email: 'braydenfraschilla@gmail.com',phone: '2039150136', age: 15, ca: '40820' },
  { name: 'Alan Lange',        email: 'alan@alange.net',            phone: '3393642526', age: 60, ca: '33326' },
  { name: 'Cole Olszewski',    email: '33colszewski@gmail.com',     phone: '8603017210', age: 15, ca: '40987' },
  { name: 'David Olszewski',   email: 'olszewskid14@gmail.com',     phone: '8603017210', age: 41, ca: '27837' },
  { name: 'Aaliyah Watson',    email: 'watsonaaliyah38@gmail.com',  phone: '2036055123', age: 16, ca: '36953' },
];

let tagged = 0, added = 0;
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'Middlefield', state: 'CT', 'Central Assign ID': r.ca }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id} (CA ${r.ca})`); tagged++;
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'Middlefield', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: 'Added from Central Assign 2026-07-29' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id} (CA ${r.ca})`); added++;
  }
}
console.log(`\nMiddlefield: ${tagged} tagged, ${added} added.`);
