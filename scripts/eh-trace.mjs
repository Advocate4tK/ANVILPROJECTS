import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const show = g => `${g.date} ${String(g.time||'').slice(0,5)} | id ${g.id} | ${g['Home Team']} vs ${g['Away Team']}` +
  ` | age ${JSON.stringify(g['Age Group'])} | gen ${JSON.stringify(g['Gender'])}` +
  ` | status ${JSON.stringify(g['Game Status'])} | CR ${JSON.stringify(g['Center Referee'])}` +
  ` | AR1 ${JSON.stringify(g['AR 1'])} | venue ${g['Venue ID']} field ${g['Field ID']}`;

// 1. every East Haddam game, newest first
const { data: eh } = await db.from('games').select('*')
  .eq('Source Club', 'East Haddam').order('date', { ascending: false }).limit(15);
console.log(`=== East Haddam games (${eh ? eh.length : 0} most recent) ===`);
(eh || []).forEach(g => console.log('  ' + show(g)));

// 2. anything at Nathan Hale-Ray (venue 711) regardless of Source Club
const { data: venue } = await db.from('games').select('*')
  .eq('Venue ID', 711).gte('date', '2026-07-01').order('date');
console.log(`\n=== games at venue 711 since Jul 1 (${venue ? venue.length : 0}) ===`);
(venue || []).forEach(g => console.log(`  ${show(g)} | src ${JSON.stringify(g['Source Club'])}`));

// 3. any game at all on 2026-08-05
const { data: day } = await db.from('games').select('*').eq('date', '2026-08-05');
console.log(`\n=== all games on 2026-08-05 (${day ? day.length : 0}) ===`);
(day || []).forEach(g => console.log(`  ${show(g)} | src ${JSON.stringify(g['Source Club'])}`));

// 4. does anything still point at a game that no longer exists?
const ids = new Set((await db.from('games').select('id')).data?.map(r => r.id) || []);
for (const tbl of ['ref_payments', 'availability']) {
  const { data, error } = await db.from(tbl).select('*').limit(2000);
  if (error) { console.log(`\n${tbl}: ${error.message}`); continue; }
  const key = Object.keys(data?.[0] || {}).find(k => /^game_?id$/i.test(k));
  if (!key) { console.log(`\n${tbl}: no game id column`); continue; }
  const orphans = (data || []).filter(r => r[key] != null && !ids.has(r[key]));
  console.log(`\n${tbl}: ${orphans.length} row(s) referencing a missing game` +
    (orphans.length ? ' -> ' + orphans.slice(0, 10).map(r => r[key]).join(', ') : ''));
}
