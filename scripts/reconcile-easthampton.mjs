import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Wade Aresco',       email: 'arescob27@gmail.com',           phone: null,         age: 14, ca: '40433' },
  { name: 'Matt Balamucki',    email: 'mbalamucki55@gmail.com',        phone: '8603386331', age: 15, ca: '38737' },
  { name: 'Ephraim Butson',    email: 'butsonephraim@gmail.com',       phone: '8603015351', age: 21, ca: '31791' },
  { name: 'Lilah Butson',      email: 'eliott20010@gmail.com',         phone: '8603018799', age: 18, ca: '34397' },
  { name: 'Scott Butson',      email: 'eliott100@live.com',            phone: '8607901122', age: 49, ca: '39518' },
  { name: 'Garrett Chretien',  email: 'gchre614@gmail.com',            phone: '8609183404', age: 15, ca: '39878' },
  { name: 'Abbie Coyne',       email: 'ccollyer17@yahoo.com',          phone: null,         age: 13, ca: '40650' },
  { name: 'Alexander Farrell', email: 'ajfarrella@gmail.com',          phone: '8603383919', age: 14, ca: '39664' },
  { name: 'Michael Farrell',   email: 'michaelfarrell2027@gmail.com',  phone: '8603731394', age: 17, ca: '39864' },
  { name: 'Christine Franzen', email: 'cefranzen.smutz@gmail.com',     phone: '8608174316', age: 46, ca: '39184' },
  { name: 'Callahan Hines',    email: 'callahanhines@icloud.com',      phone: '8609496224', age: 14, ca: '39927' },
  { name: 'Benjamin Kennedy',  email: 'bkennedy178@yahoo.com',         phone: '8604616962', age: 13, ca: '40617' },
  { name: 'Maya Korczak',      email: 'mayakorczak28@gmail.com',       phone: null,         age: 20, ca: '40884' },
];

let tagged = 0, added = 0;
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'East Hampton', state: 'CT', 'Central Assign ID': r.ca }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id} (CA ${r.ca})`); tagged++;
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'East Hampton', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: 'Added from Central Assign 2026-07-28' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id} (CA ${r.ca})`); added++;
  }
}
console.log(`\nEast Hampton: ${tagged} tagged, ${added} added (East Haddam area — not pooled).`);
