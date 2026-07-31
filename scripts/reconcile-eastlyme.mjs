import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Greyson Biggs',    email: 'greybiggs10@icloud.com',       phone: '8607726998', age: 15, ca: '37855' },
  { name: 'Walt Dombrowski',  email: 'waltdombrowski30@gmail.com',   phone: '9795747751', age: 14, ca: '39867' },
  { name: 'Henry Garabedian', email: 'henry.garabedian9@gmail.com',  phone: '8609496899', age: 17, ca: '37763' },
  { name: 'Jordan Greeno',    email: 'jordan.greeno@icloud.com',     phone: '8602353628', age: 16, ca: '38332' },
  { name: 'Emily Herrera',    email: '2009.emily.herrera@gmail.com', phone: '8604518696', age: 17, ca: '35336' },
  { name: 'Eric Herrera',     email: '2010.eric.herrera@gmail.com',  phone: '9146462927', age: 15, ca: '38440' },
  { name: 'Olga Herrera',     email: 'fischeom@aol.com',             phone: '9146462927', age: 52, ca: '35335' },
  { name: 'Anders Johnson',   email: 'anderssoccer28@gmail.com',     phone: '9592391379', age: 14, ca: '40257' },
  { name: 'Emily Salek',      email: 'emily_salek@icloud.com',       phone: '8603264193', age: 18, ca: '34587' },
  { name: 'Matthew Salek',    email: 'matthew_salek@icloud.com',     phone: '9592391072', age: 17, ca: '35286' },
];

let tagged = 0, added = 0;
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'East Lyme', state: 'CT', 'Central Assign ID': r.ca }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id} (CA ${r.ca})`); tagged++;
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'East Lyme', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: 'Added from Central Assign 2026-07-28' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id} (CA ${r.ca})`); added++;
  }
}
console.log(`\nEast Lyme: ${tagged} tagged, ${added} added (Griswold territory — not pooled).`);
