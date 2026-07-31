import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

// 1. Tag existing refs (blank town) → Woodstock, CT
const TAG = [1309, 1100, 1276, 1295, 1211, 1368, 1101, 1255, 1135];
for (const id of TAG) {
  const { error } = await db.from('referees').update({ city: 'Woodstock', state: 'CT' }).eq('id', id);
  console.log(error ? `tag #${id} FAIL: ${error.message}` : `tagged #${id} → Woodstock, CT`);
}

// 2. Add the genuinely new ones
const NEW = [
  { name: 'Carson Bartels',    email: 'carsonjbartels@icloud.com',      phone: null,         city: 'Woodstock',       state: 'CT', age: 13, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
  { name: 'Charlotte Caisse',  email: 'charsoccer20@icloud.com',        phone: '8609163350', city: 'Woodstock',       state: 'CT', age: 16, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
  { name: 'Melissa Caisse',    email: 'missycaisse@gmail.com',          phone: '8609163350', city: 'Woodstock',       state: 'CT', age: 47, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
  { name: 'Harrison MacDonald',email: 'harrisonmacdonald170@gmail.com', phone: '5086126567', city: 'Woodstock',       state: 'CT', age: 13, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
  { name: 'Wyatt Matulis',     email: 'mattyssox@gmail.com',            phone: null,         city: 'Woodstock',       state: 'CT', age: 16, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
  { name: 'Dylan Syriac',      email: 'dylans0511@outlook.com',         phone: null,         city: 'Woodstock Valley',state: 'CT', age: 16, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
];
for (const r of NEW) {
  const { data: exists } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (exists && exists.length) { console.log(`skip ${r.name} — already #${exists[0].id}`); continue; }
  const { data, error } = await db.from('referees').insert(r).select('id').single();
  console.log(error ? `add ${r.name} FAIL: ${error.message}` : `added ${r.name} → #${data.id}`);
}
