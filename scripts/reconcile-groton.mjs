import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const refs = [
  { name: 'Glory Alagbe',           email: 'christiana.alagbe@gmail.com',  phone: '8609840259', age: 13, ca: '40684' },
  { name: 'Jacob Cieplik',          email: 'jcieplik08@icloud.com',        phone: '8605016393', age: 18, ca: '36713' },
  { name: 'Mark Dwumfour',          email: 'mcjun4@gmail.com',             phone: '9735190299', age: 48, ca: '37857' },
  { name: 'Andre Gonzalez Pothier', email: 'cpothier80@gmail.com',         phone: '8603897242', age: 14, ca: '40089' },
  { name: 'David Goodrich',         email: 'd4ve.goodrich@gmail.com',      phone: '2035352133', age: 31, ca: '3852'  },
  { name: 'Christina Leopoulos',    email: 'leopouloschristina@gmail.com', phone: '8607729989', age: 17, ca: '38149' },
  { name: 'Joshua Mason',           email: 'joshuamasondevon@gmail.com',   phone: null,         age: 28, ca: '40401' },
  { name: 'Mark Mravic',            email: 'markmravic@gmail.com',         phone: '9174280704', age: 63, ca: '34634' },
  { name: 'Thomas Scagliarini',     email: 'tscagliarini@comcast.net',     phone: '8605142485', age: 63, ca: '911'   },
  { name: 'Marco Ursini',           email: 'jlu1973@hotmail.com',          phone: '8604606318', age: 18, ca: '34805', note: 'CA reg EXPIRED (2022)' },
];

for (const r of refs) {
  const note = r.note ? `Added from Central Assign 2026-07-28 — ${r.note}` : 'Added from Central Assign 2026-07-28';
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    const upd = { city: 'Groton', state: 'CT', 'Central Assign ID': r.ca };
    if (r.note) upd.notes = note;
    await db.from('referees').update(upd).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id} (CA ${r.ca})${r.note ? ' ['+r.note+']' : ''}`);
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'Groton', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: note }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id} (CA ${r.ca})${r.note ? ' ['+r.note+']' : ''}`);
  }
}
