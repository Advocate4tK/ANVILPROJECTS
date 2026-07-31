import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Rowan Cantner',      email: 'rowancantner@gmail.com',      phone: '8606089553', age: 14, ca: '40696' },
  { name: 'Reagan Christopher', email: 'reggyc1234@icloud.com',       phone: '8609842806', age: 15, ca: '38923' },
  { name: 'Alexis Fenton',      email: 'alexisfenton88@gmail.com',    phone: '8608767797', age: 20, ca: '33795' },
  { name: 'Jonah Filardi',      email: 'jonah.filardi@gmail.com',     phone: '8603399814', age: 16, ca: '37856' },
  { name: 'Ava Fuller',         email: 'fullerava13@gmail.com',       phone: '8603000143', age: 15, ca: '37853' },
  { name: 'Justin Fuller',      email: 'jfullersoccer@gmail.com',     phone: '6785961675', age: 46, ca: '37814' },
  { name: 'Tanner Glantz',      email: 't_glantz@comcast.net',        phone: '8608187368', age: 43, ca: '19929' },
  { name: 'Ellianna Iaia',      email: 'kimlynn12@yahoo.com',         phone: null,         age: 15, ca: '40227' },
  { name: 'Robert Janes',       email: 'robert.janes1@comcast.net',   phone: '2035302288', age: 63, ca: '2993'  },
  { name: 'Russell Linderman',  email: 'rlinderman30@gmail.com',      phone: '8603674060', age: 71, ca: '684'   },
  { name: 'Marco Mazzi',        email: 'mazzim@gmail.com',            phone: '8609645043', age: 59, ca: '35433' },
  { name: 'Broderick Morris',   email: 'broderickamorris@gmail.com',  phone: null,         age: 14, ca: '40670' },
  { name: 'Grace Morrissette',  email: 'morrissette.grace@gmail.com', phone: '8605018791', age: 16, ca: '38094' },
];

let tagged = 0, added = 0;
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'Old Lyme', state: 'CT', 'Central Assign ID': r.ca }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id} (CA ${r.ca})`); tagged++;
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'Old Lyme', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: 'Added from Central Assign 2026-07-28' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id} (CA ${r.ca})`); added++;
  }
}
console.log(`\nOld Lyme: ${tagged} tagged, ${added} added (East Haddam territory — not pooled).`);
