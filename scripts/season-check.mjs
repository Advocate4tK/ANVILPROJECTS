import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const { data: all } = await db.from('games').select('id,date,"Source Club",season,status,"Game Status"').limit(5000);
const withSeason = (all || []).filter(g => g.season != null && g.season !== '');
console.log(`games total: ${all.length} | with a season value: ${withSeason.length}`);
withSeason.slice(0, 20).forEach(g => console.log(`   id ${g.id} ${g.date} ${g['Source Club']} -> ${JSON.stringify(g.season)}`));

const statuses = {};
(all || []).forEach(g => { const k = JSON.stringify(g.status); statuses[k] = (statuses[k] || 0) + 1; });
console.log('\nstatus column distribution:', JSON.stringify(statuses));

const gs = {};
(all || []).forEach(g => { const k = JSON.stringify(g['Game Status']); gs[k] = (gs[k] || 0) + 1; });
console.log('Game Status distribution:', JSON.stringify(gs));

// what columns does referees actually have, and can we find Jack Nelan
const { data: r1 } = await db.from('referees').select('*').limit(1);
console.log('\nreferees columns:', Object.keys(r1?.[0] || {}).join(', '));
const { data: jack } = await db.from('referees').select('*').or('"Name".ilike.%nelan%,name.ilike.%nelan%');
console.log('Jack Nelan matches:', (jack || []).length);
(jack || []).forEach(r => console.log('   id', r.id, '|', JSON.stringify(r['Name'] ?? r.name), '| CA', r['Central Assign ID'], '| status', JSON.stringify(r.status)));
