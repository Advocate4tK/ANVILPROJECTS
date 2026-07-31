import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');
const { data, error } = await db.from('referees').select('city, state, address');
if (error) { console.log('Error:', error.message); process.exit(1); }
const has = v => v != null && String(v).trim() !== '';
console.log('total:', data.length);
console.log('has city:', data.filter(r => has(r.city)).length);
console.log('has state:', data.filter(r => has(r.state)).length);
console.log('has address:', data.filter(r => has(r.address)).length);
const towns = {}; data.forEach(r => { const c = (r.city || '').trim(); if (c) towns[c] = (towns[c]||0)+1; });
const list = Object.entries(towns).sort((a,b) => b[1]-a[1]);
console.log('distinct towns:', list.length);
console.log('top:', list.slice(0,15).map(([c,n]) => `${c}(${n})`).join(', '));
