import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Gerry Baird',      email: 'lmlkmama@gmail.com',        phone: '8603045088', age: 48, ca: '40680' },
  { name: 'Lilah Baird',      email: 'lilahbaird@gmail.com',      phone: null,         age: 15, ca: '39754' },
  { name: 'Lincoln Baird',    email: 'lincolnbaird26@gmail.com',  phone: '9592391046', age: 14, ca: '39855' },
  { name: 'Andrew Costanza',  email: 'mancityrl123@gmail.com',    phone: '8608760498', age: 15, ca: '39468' },
  { name: 'Craig Cusson',     email: 'crger16@aol.com',           phone: '8605103035', age: 49, ca: '1267'  },
  { name: 'Katrina Harris',   email: 'harriskatrina040@gmail.com',phone: '8608765336', age: 17, ca: '38355' },
  { name: 'Donald Hazuka',    email: 'gr8owtdorz@gmail.com',      phone: '2038433486', age: 66, ca: '1383'  },
  { name: 'Declan Healey',    email: 'ddh003@icloud.com',         phone: '2034642716', age: 13, ca: '40519' },
  { name: 'Chris Horan',      email: 'cjhoran@sbcglobal.net',     phone: '8605752721', age: 60, ca: '28776' },
  { name: 'Colbie LeClaire',  email: 'sleclaire@sbcglobal.net',   phone: '2039153690', age: 16, ca: '38591' },
  { name: 'Samuel Mangler',   email: 'samuel.mangler@gmail.com',  phone: '8607190944', age: 16, ca: '38696' },
  { name: 'Addisyn Massey',   email: 'addisynmassey@yahoo.com',   phone: '8605759197', age: 15, ca: '38870' },
  { name: 'Grayson Meder',    email: 'graysonmeder@gmail.com',    phone: '8603399974', age: 15, ca: '38760' },
];

let tagged = 0, added = 0;
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'Clinton', state: 'CT', 'Central Assign ID': r.ca }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id} (CA ${r.ca})`); tagged++;
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'Clinton', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: 'Added from Central Assign 2026-07-29' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id} (CA ${r.ca})`); added++;
  }
}
console.log(`\nClinton: ${tagged} tagged, ${added} added.`);
