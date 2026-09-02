import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const { data: club } = await db.from('clubs').select('*').ilike('name', '%haddam%');
(club || []).forEach(c => console.log('club:', c.id, JSON.stringify(c.name), '| ca_league_id', c.ca_league_id, '| ca_league', c.ca_league));

const { data: games } = await db.from('games')
  .select('id,date,time,"Home Team","Away Team","Age Group","Gender","Source Club","Venue ID","Field ID","Game Status"')
  .eq('Source Club', 'East Haddam').gte('date', '2026-08-01').lte('date', '2026-08-14')
  .order('date').order('time');

console.log(`\nEast Haddam games Aug 1-14: ${games ? games.length : 0}`);
(games || []).forEach(g => console.log(
  `  ${g.date} ${g.time}  ${g['Home Team']} vs ${g['Away Team']}  [${g['Age Group']||'—'}] ${g['Gender']||'—'}  venue ${g['Venue ID']??'—'} field ${g['Field ID']??'—'}  ${g['Game Status']||''}`));

// what the next games are at ALL, in case the window is wrong
const { data: any } = await db.from('games').select('date,"Home Team","Away Team"')
  .eq('Source Club', 'East Haddam').gte('date', '2026-07-31').order('date').limit(5);
console.log('\nnext East Haddam games from today:');
(any || []).forEach(g => console.log(`  ${g.date}  ${g['Home Team']} vs ${g['Away Team']}`));
