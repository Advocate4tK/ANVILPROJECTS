import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Asa Augusta',      email: 'asalaugusta@gmail.com',       phone: null,         age: 16 },
  { name: 'Nolan Fonscas',    email: 'nolan.fonzy@gmail.com',       phone: '4015006840', age: 15 },
  { name: 'Ronald Goldstein', email: 'goldstringrs@aol.com',        phone: '8604238186', age: 75 },
  { name: 'Nourddine Jalal',  email: 'socreco5@gmail.com',          phone: '8606397173', age: 65 },
  { name: 'Noah Kopplin',     email: 'noahjkopplin@gmail.com',      phone: null,         age: 15 },
  { name: 'William Kopplin',  email: 'kopplin.william@gmail.com',   phone: '8602042057', age: 43 },
  { name: 'Brody Merritt',    email: 'brodym299@gmail.com',         phone: '8602225589', age: 14 },
  { name: 'Enrico Obst',      email: 'eobst11@gmail.com',           phone: null,         age: 40 },
  { name: 'James Russo',      email: 'jamesrusso341@gmail.com',     phone: '8602054472', age: 71 },
  { name: 'Cameron Watkins',  email: 'cameronwatkins7250@gmail.com',phone: '8602351680', age: 17 },
  { name: 'Carter Watkins',   email: 'carterwatkins3939@gmail.com', phone: '8603349931', age: 14 },
];

let tagged = 0, added = 0;
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'Lebanon', state: 'CT' }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id}`); tagged++;
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'Lebanon', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id}`); added++;
  }
}
console.log(`\nLebanon: ${tagged} tagged, ${added} added. (NOT pooled — East Haddam/Griswold refs.)`);
