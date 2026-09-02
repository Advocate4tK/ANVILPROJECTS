// Dry run of js/central-assign-export.js for the Girls Summer League games.
// Mirrors the browser logic exactly so the output can be eyeballed before upload.
import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const CA_LEAGUE_NAMES = { 19: 'CT Northeast District Travel League' };
const csvCell = v => {
  const s = (v === null || v === undefined) ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const halfLen = d => { const m = String(d || '').match(/(\d+)\s*$/); return m ? parseInt(m[1]) : ''; };
const fmtDate = s => { const [y,m,d] = String(s).slice(0,10).split('-');
  return `${String(+m).padStart(2,'0')}/${String(+d).padStart(2,'0')}/${y}`; };
const fmtTime = t => { const [h,m] = String(t).split(':').map(Number);
  return isNaN(h) ? t : `${h % 12 || 12}:${String(m||0).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`; };

const { data: ev } = await db.from('events').select('"Club Name", age_groups').eq('id', 2).single();
const src = ev['Club Name'];
const ag  = ev.age_groups[0];
const ageKey = String(ag.age_group).replace(/\s.*$/,'').replace(/[BGbg]$/,'').toUpperCase();
const league = CA_LEAGUE_NAMES[ag.ca_league_id] || '';
// CA validates # Refs against its own league configuration (Northeast U19 = 3)
// and rejects the row on a mismatch. This is CA's number, not our staffing.
const crew    = ageKey === 'U8' ? 1 : 3;
const usesARs = (ag.ar1 || ag.ar2) ? true : false;

const { data: venues } = await db.from('venues').select('"Venue ID","Venue Name"');
const { data: fields } = await db.from('fields').select('"Field ID","Field Name"');
const vName = Object.fromEntries(venues.map(v => [v['Venue ID'], v['Venue Name']]));
const fName = Object.fromEntries(fields.map(f => [f['Field ID'], f['Field Name']]));

const { data: games } = await db.from('games')
  .select('id,date,time,"Home Team","Away Team","Age Group","Gender","Venue ID","Field ID","Game Status"')
  .eq('Source Club', src).gte('date','2026-08-01').lte('date','2026-08-07')
  .order('date').order('time');

const headers = ['Date','Time','League','Age Group','Gender','# Refs','Half Length (min)',
  'Home Team','Visiting Team','Venue','Field','Division','Game Type','Home Club','Visiting Club',
  'Home Coach Email','Visiting Coach Email','Primary Assignor Email','Secondary Assignor Email',
  'External System','External Game ID','Referee Fee','AR Fee','Fourth Official Fee'];

const rows = (games || [])
  .filter(g => (g['Game Status'] || '').toLowerCase() !== 'cancelled')
  .map(g => {
    const gRaw = (g['Gender'] || '').trim();
    const gender = ['Male','Boys'].includes(gRaw) ? 'Male'
                 : ['Female','Girls'].includes(gRaw) ? 'Female' : 'Coed';
    return [
      fmtDate(g.date), fmtTime(g.time), league, ageKey, gender, crew, halfLen(ag.duration),
      g['Home Team'] || '', g['Away Team'] || '',
      vName[g['Venue ID']] || '', fName[g['Field ID']] || '',
      '', 'League',
      // Home Club / Visiting Club are REQUIRED by CA and validated against CA's
      // own club registry — this exact string was read off the Edit Game
      // dropdown. NOT "NECONN Soccer Club": CA carries Neconn and Brooklyn as a
      // single combined entry, cased "Neconn", ending in "Soccer" not "Soccer
      // Club". GSL runs as a subsidy of NECONN, so both sides are this club.
      'Neconn Soccer Club & Brooklyn Youth Soccer',
      'Neconn Soccer Club & Brooklyn Youth Soccer',
      '', '', '', '',
      // AR Fee: CA opens 3 assignment rows (its league config) and each needs a
      // non-null rate — a 0 came back as
      //   null value in column "referee_game_rate" ... violates not-null constraint
      // 25 is CA's own default and already what their existing GSL games carry.
      // It is not what anybody gets paid; our pay portal is the authority.
      'Referee Tool', g.id, ag.center ?? '', usesARs ? (ag.ar ?? 25) : 25, 0
    ].map(csvCell).join(',');
  });

console.log(`event: ${src} | league: ${league || '(NONE — export would refuse)'} | crew ${crew} | half ${halfLen(ag.duration)} | fee ${ag.center}`);
console.log(`games Aug 1-7: ${rows.length}\n`);
console.log(headers.map(csvCell).join(','));
rows.forEach(r => console.log(r));

// Write the file. No BOM, CRLF — byte-for-byte the shape of CA's own
// game_import_sample.csv, which has neither a BOM nor LF-only endings.
const { writeFileSync } = await import('node:fs');
const out = [headers.map(csvCell).join(','), ...rows].join('\r\n') + '\r\n';
const path = 'C:\\Users\\Daddy\\Desktop\\ANVIL PROJECTS\\referee-tool\\Central Assign\\UPLOADS\\GSL-2026-08-03_to_08-06.csv';
writeFileSync(path, out, { encoding: 'utf8' });
console.log(`\nwrote ${out.length} bytes -> ${path}`);
