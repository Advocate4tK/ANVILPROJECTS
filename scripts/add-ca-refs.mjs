import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const NEW = [
  { name: 'TJ Charbonneau', email: 'neconnsoccer1@gmail.com', phone: null,         city: 'Thompson',    state: 'CT', age: 15, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
  { name: 'Adam Thompson',  email: 'wahooadam.at@gmail.com',  phone: '8608039362', city: 'Killingworth', state: 'CT', age: 51, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
  { name: 'Ronan Thompson', email: 'nixonkj@hotmail.com',     phone: '4752583629', city: 'Wilton',      state: 'CT', age: 15, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
];

for (const r of NEW) {
  // guard against a dupe by email
  const { data: exists } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (exists && exists.length) { console.log(`skip ${r.name} — already exists #${exists[0].id}`); continue; }
  const { data, error } = await db.from('referees').insert(r).select('id').single();
  console.log(error ? `FAIL ${r.name}: ${error.message}` : `added ${r.name} → #${data.id}`);
}
