import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const NEW = [
  { name: 'Kira Bulmer',      email: 'kacbulmer8@gmail.com',      phone: '8605766672', city: 'Brooklyn', state: 'CT', age: 14, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
  { name: 'Gabriel Covington',email: 'gabrielsoccer133@gmail.com',phone: '8602084785', city: 'Brooklyn', state: 'CT', age: 15, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
  { name: 'Lochlan Curran',   email: 'lochlan.curran@icloud.com', phone: '6318711646', city: 'Brooklyn', state: 'CT', age: 14, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
  { name: 'Ronan Curran',     email: 'ronan.curran@icloud.com',   phone: '6318711646', city: 'Brooklyn', state: 'CT', age: 17, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
  { name: 'Lilah Ledogar',    email: 'lilahledogar@icloud.com',   phone: null,          city: 'Brooklyn', state: 'CT', age: 16, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
  { name: 'Lucie Ledogar',    email: 'lucieledogar@gmail.com',    phone: null,          city: 'Brooklyn', state: 'CT', age: 13, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' },
];

for (const r of NEW) {
  const { data: exists } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (exists && exists.length) { console.log(`skip ${r.name} — already #${exists[0].id}`); continue; }
  const { data, error } = await db.from('referees').insert(r).select('id').single();
  console.log(error ? `FAIL ${r.name}: ${error.message}` : `added ${r.name} → #${data.id}`);
}
