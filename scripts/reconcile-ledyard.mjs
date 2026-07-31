import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Christophe Allais',  email: 'allais.chris@gmail.com',       phone: '5614063406', age: 42, ca: '39392' },
  { name: 'Eli Dozier',         email: 'doziere0415@gmail.com',        phone: '8609120942', age: 14, ca: '39401' },
  { name: 'Margaret Dykes',     email: 'maggiedykas977@gmail.com',     phone: null,         age: 18, ca: '34466' },
  { name: 'Alex Engel',         email: 'alex.h.engel18@gmail.com',     phone: '8607018829', age: 16, ca: '38190' },
  { name: 'Alexander Fritsch',  email: 'fritscaj@yahoo.com',           phone: '5185775640', age: 43, ca: '37019' },
  { name: 'Brian Glenn',        email: 'bgatpyc@gmail.com',            phone: '8154515344', age: 51, ca: '39052' },
  { name: 'Emily Glenn',        email: 'eglenn10@icloud.com',          phone: '8154515344', age: 16, ca: '38344' },
  { name: 'Nicholas Harr',      email: 'buckeye45881@gmail.com',       phone: '8086907952', age: 43, ca: '39049' },
  { name: 'Wesley Hill',        email: 'hillwd11@gmail.com',           phone: '5756445636', age: 47, ca: '35337' },
  { name: 'Michael Munger',     email: 'scottish69247@gmail.com',      phone: '8603340617', age: 48, ca: '32521' },
  { name: 'Alexander Vidal',    email: 'alexander.w.vidal@gmail.com',  phone: '8602872293', age: 14, ca: '39157' },
  { name: 'Nathaniel Vidal',    email: 'natevidal10@gmail.com',        phone: '8603343614', age: 20, ca: '32283' },
  { name: 'Victoria Vidal',     email: 'victoria.d.vidal@gmail.com',   phone: '2037683930', age: 17, ca: '34637' },
  { name: 'William Vidal',      email: 'william.vidaliii@gmail.com',   phone: '2038086499', age: 50, ca: '32282' },
];

let tagged = 0, added = 0;
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'Ledyard', state: 'CT', 'Central Assign ID': r.ca }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id} (CA ${r.ca})`); tagged++;
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'Ledyard', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: 'Added from Central Assign 2026-07-28' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id} (CA ${r.ca})`); added++;
  }
}
console.log(`\nLedyard: ${tagged} tagged, ${added} added (Griswold territory — not pooled).`);
