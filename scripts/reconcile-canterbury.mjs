import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');
const POOL = 2; // NorthEast

const refs = [
  { name: 'Donna Coombs',      email: 'dcoombs900@gmail.com',     phone: '9592470581', age: 16 },
  { name: 'Liam Forsyth',      email: 'corey.forsyth87@gmail.com',phone: '9592423363', age: 14 },
  { name: 'Michael Lee',       email: 'milee98@yahoo.com',        phone: '8603725400', age: 50 },
  { name: 'Morgan Lee',        email: 'jl704m@gmail.com',         phone: '8606435571', age: 16 },
  { name: 'Kasey OBrien',      email: 'kasey29tractor@gmail.com', phone: '8603340011', age: 16 },
  { name: 'David Paquette',    email: 'davepaq1122@gmail.com',    phone: '8602042520', age: 45 },
  { name: 'Hannah Perkins',    email: 'jverraneault@yahoo.com',   phone: '8602070388', age: 14 },
  { name: 'Alaina Pescatello', email: 'apescatello@gmail.com',    phone: null,         age: 14 },
  { name: 'Oriana Pescatello', email: 'oepescatello@gmail.com',   phone: null,         age: 15 },
  { name: 'Francis Senat',     email: 'sjbf28@gmail.com',         phone: '8602370410', age: 58 },
  { name: 'Aliyah Simas',      email: 'shawnamsimas@gmail.com',   phone: '8603772450', age: 14 },
];

const ids = [];
for (const r of refs) {
  const { data: ex } = await db.from('referees').select('id').ilike('email', r.email).limit(1);
  if (ex && ex.length) {
    await db.from('referees').update({ city: 'Canterbury', state: 'CT' }).eq('id', ex[0].id);
    console.log(`tagged  ${r.name} → #${ex[0].id}`);
    ids.push(ex[0].id);
  } else {
    const { data, error } = await db.from('referees').insert({ name: r.name, email: r.email, phone: r.phone, city: 'Canterbury', state: 'CT', age: r.age, 'Certification Level': 'Grassroots', notes: 'Added from Central Assign 2026-07-28' }).select('id').single();
    if (error) { console.log(`FAIL ${r.name}: ${error.message}`); continue; }
    console.log(`added   ${r.name} → #${data.id}`);
    ids.push(data.id);
  }
}

// Add all to NorthEast (skip existing members)
const { data: mem } = await db.from('pool_members').select('referee_id').eq('pool_id', POOL);
const have = new Set(mem.map(m => m.referee_id));
const toPool = ids.filter(id => !have.has(id));
if (toPool.length) {
  const { error } = await db.from('pool_members').insert(toPool.map(id => ({ pool_id: POOL, referee_id: id })));
  console.log(error ? `pool add FAIL: ${error.message}` : `\nAdded ${toPool.length} to NorthEast.`);
}
const { count } = await db.from('pool_members').select('*', { count: 'exact', head: true }).eq('pool_id', POOL);
console.log(`NorthEast now: ${count} members`);
