import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const { data: jack } = await db.from('referees').select('*').ilike('name', '%nelan%');
console.log('=== referees matching "nelan" ===');
(jack || []).forEach(r => console.log(`  id ${r.id} | ${r.name} | ${r.email} | status ${JSON.stringify(r.status)} | src ${JSON.stringify(r.source_club)}`));

const { data: a1 } = await db.from('availability').select('*').limit(1);
console.log('\navailability columns:', Object.keys(a1?.[0] || {}).join(', '));

const { data: av } = await db.from('availability').select('*').order('id', { ascending: false }).limit(400);
console.log(`\navailability rows pulled: ${av ? av.length : 0}`);

// group by whatever the club/entity column turns out to be
const keys = Object.keys(av?.[0] || {});
const clubKey = keys.find(k => /club|event|source|entity/i.test(k));
console.log('entity column detected:', clubKey);
if (clubKey) {
  const counts = {};
  (av || []).forEach(r => { const k = JSON.stringify(r[clubKey]); counts[k] = (counts[k] || 0) + 1; });
  console.log('counts by entity:', JSON.stringify(counts, null, 2));
}

// anything mentioning Ellis or East Haddam
const hits = (av || []).filter(r => /ellis|haddam/i.test(JSON.stringify(r)));
console.log(`\nrows mentioning Ellis or Haddam: ${hits.length}`);
hits.slice(0, 25).forEach(r => console.log('   ' + JSON.stringify(r).slice(0, 320)));
