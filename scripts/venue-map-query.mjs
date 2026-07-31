import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');
const {data,error} = await db.from('games').select('"Venue ID","Age Group","Field ID"').eq('game_type','Tournament');
if (error) { console.log('Error:', error.message); process.exit(1); }
const venues = {};
data.forEach(r => {
  const v = r['Venue ID'];
  if (!venues[v]) venues[v] = {ags:{}, fields:new Set()};
  const ag = r['Age Group'] || '?';
  venues[v].ags[ag] = (venues[v].ags[ag]||0)+1;
  if (r['Field ID']) venues[v].fields.add(r['Field ID']);
});
Object.entries(venues).sort((a,b)=>Number(a[0])-Number(b[0])).forEach(([v,info]) => {
  const sorted = Object.entries(info.ags).sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true}));
  const total = sorted.reduce((s,[,c])=>s+c,0);
  console.log(`Venue ${v} [${info.fields.size} fields, ${total} games]: ${sorted.map(([ag,c])=>ag+'('+c+')').join(' ')}`);
});
