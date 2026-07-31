import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

// email, CA id, name, phone, age  (whole Lebanon set, both pages)
const refs = [
  { name: 'Asa Augusta',        email: 'asalaugusta@gmail.com',        ca: '40090', phone: null,         age: 16 },
  { name: 'Nolan Fonscas',      email: 'nolan.fonzy@gmail.com',        ca: '40935', phone: '4015006840', age: 15 },
  { name: 'Ronald Goldstein',   email: 'goldstringrs@aol.com',         ca: '1360',  phone: '8604238186', age: 75 },
  { name: 'Nourddine Jalal',    email: 'socreco5@gmail.com',           ca: '5523',  phone: '8606397173', age: 65 },
  { name: 'Noah Kopplin',       email: 'noahjkopplin@gmail.com',       ca: '40349', phone: null,         age: 15 },
  { name: 'William Kopplin',    email: 'kopplin.william@gmail.com',    ca: '40300', phone: '8602042057', age: 43 },
  { name: 'Brody Merritt',      email: 'brodym299@gmail.com',          ca: '38907', phone: '8602225589', age: 14 },
  { name: 'Enrico Obst',        email: 'eobst11@gmail.com',            ca: '40490', phone: null,         age: 40 },
  { name: 'James Russo',        email: 'jamesrusso341@gmail.com',      ca: '1547',  phone: '8602054472', age: 71 },
  { name: 'Cameron Watkins',    email: 'cameronwatkins7250@gmail.com', ca: '36819', phone: '8602351680', age: 17 },
  { name: 'Carter Watkins',     email: 'carterwatkins3939@gmail.com',  ca: '38965', phone: '8603349931', age: 14 },
  { name: 'Christopher Watkins',email: 'watkins.christopher01@gmail.com',ca: '31422',phone: '8603349931', age: 53 },
  { name: 'Kolby Whitcher',     email: 'kolbyjwhitcher@gmail.com',     ca: '39151', phone: '8609937681', age: 14 },
];

for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'Lebanon', state: 'CT', 'Central Assign ID': r.ca }).eq('id', ex[0].id);
    console.log(`updated ${r.name} → #${ex[0].id} (CA ${r.ca})`);
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'Lebanon', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', 'Central Assign ID': r.ca, notes: 'Added from Central Assign 2026-07-28' }).select('id').single();
    console.log(error ? `FAIL ${r.name}: ${error.message}` : `added   ${r.name} → #${data.id} (CA ${r.ca})`);
  }
}
