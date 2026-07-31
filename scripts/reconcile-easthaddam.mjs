import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Gunnar Anderson',  email: 'gunnarhans21@gmail.com',    phone: '8603011621', age: 17, ca: '37057' },
  { name: 'Jonathan Antone',  email: 'jonathantantone@icloud.com',phone: '8603733149', age: 15, ca: '39220' },
  { name: 'Jaxson Barber',    email: 'jaxsonbarber78@gmail.com',   phone: '8608538337', age: 14, ca: '40776' },
  { name: 'Isabella Cuscina', email: 'isabella.cuscina@gmail.com', phone: '8602624313', age: 15, ca: '39946' },
  { name: 'Madelyn Ems',      email: 'maddyems443@gmail.com',      phone: '8602221427', age: 14, ca: '39866' },
  { name: 'Timothy Ems',      email: 'tems13@gmail.com',           phone: '8609892687', age: 47, ca: '39875' },
  { name: 'Beckett Feulner',  email: 'afeulner@optionagroup.com',  phone: '8609640650', age: 17, ca: '37206' },
  { name: 'Jack Nelan',       email: 'jacknelan@hotmail.com',      phone: '8608175753', age: 71, ca: '895'   },
  { name: 'Kevin Robidoux',   email: 'kevinrobidoux4@gmail.com',   phone: '8605341167', age: 14, ca: '41021' },
  { name: 'Eli Wilkins',      email: 'elismithwilkins@gmail.com',  phone: null,         age: 13, ca: '40714' },
];

let tagged = 0, added = 0;
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'East Haddam', state: 'CT', 'Central Assign ID': r.ca }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id} (CA ${r.ca})`); tagged++;
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'East Haddam', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: 'Added from Central Assign 2026-07-28' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id} (CA ${r.ca})`); added++;
  }
}
console.log(`\nEast Haddam: ${tagged} tagged, ${added} added (East Haddam territory — not pooled).`);
