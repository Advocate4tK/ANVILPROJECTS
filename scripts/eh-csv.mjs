// East Haddam Aug 5 control test — a completely different configuration from
// GSL: Southeast district instead of Northeast, a club instead of an event,
// Male instead of Female, two different clubs instead of one on both sides.
// If this fails with the same referee_game_rate error, the CA importer is
// broken for everything, not just our GSL setup.
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const csvCell = v => {
  const s = (v === null || v === undefined) ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const fmtDate = s => { const [y,m,d] = String(s).slice(0,10).split('-');
  return `${String(+m).padStart(2,'0')}/${String(+d).padStart(2,'0')}/${y}`; };
const fmtTime = t => { const [h,m] = String(t).split(':').map(Number);
  return isNaN(h) ? t : `${h % 12 || 12}:${String(m||0).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`; };

const { data: g } = await db.from('games')
  .select('id,date,time,"Home Team","Away Team","Age Group","Gender","Venue ID","Field ID"')
  .eq('id', 2905).single();

const { data: v } = await db.from('venues').select('"Venue ID","Venue Name"').eq('"Venue ID"', g['Venue ID']).single();
const { data: f } = await db.from('fields').select('"Field ID","Field Name"').eq('"Field ID"', g['Field ID']).single();

const headers = ['Date','Time','League','Age Group','Gender','# Refs','Half Length (min)',
  'Home Team','Visiting Team','Venue','Field','Division','Game Type','Home Club','Visiting Club',
  'Home Coach Email','Visiting Coach Email','Primary Assignor Email','Secondary Assignor Email',
  'External System','External Game ID','Referee Fee','AR Fee','Fourth Official Fee'];

const row = [
  fmtDate(g.date),
  fmtTime(g.time),
  'CT Southeast District Travel League',   // East Haddam's district, per Tod
  'U19',
  'Male',                                   // games row says "Boys"
  3,                                        // CA validates against league config
  45,                                       // U19 default: 2 x 45
  g['Home Team'],
  g['Away Team'],
  v['Venue Name'],
  f['Field Name'],
  '',                                       // Division
  'League',
  'East Haddam Soccer Club',                // read off CA's own dropdown
  'Valley Regional Soccer Club',            // read off CA's own dropdown
  '', '', '', '',
  'Referee Tool',
  g.id,
  40, 25, 0                                 // East Haddam has no U19 band; these
                                            // match what CA already carries
].map(csvCell).join(',');

const out = [headers.map(csvCell).join(','), row].join('\r\n') + '\r\n';
const path = 'C:\\Users\\Daddy\\Desktop\\ANVIL PROJECTS\\referee-tool\\Central Assign\\UPLOADS\\EastHaddam-2026-08-05.csv';
writeFileSync(path, out, { encoding: 'utf8' });

console.log(headers.map(csvCell).join(','));
console.log(row);
console.log(`\nwrote ${out.length} bytes -> ${path}`);
