// Referees in the five towns Ed Conn asked about (2026-09-14):
// Griswold, Jewett City, Voluntown, Preston, Lisbon.
//
// Re-runnable — regenerate after any Central Assign harvest and re-send.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');
const TOWNS = ['Griswold','Jewett City','Voluntown','Preston','Lisbon'];
const OUT   = 'D:/Docs n Files/TLS Share/ASSIGNOR/griswold-area-referees.csv';

// ⚠️ MUST PAGINATE — PostgREST silently caps a plain select at 1000 rows, and this
//    roster is 3400+. The first cut of this list returned 3 referees because of it.
let all = [], from = 0;
for (;;) {
  const { data, error } = await db.from('referees').select(
    'name,age,city,phone,email,"Central Assign ID","Guardian Name","Guardian Email",' +
    '"Guardian Phone",registration_year,"Certification Level","Years Reffing","Club Preference"'
  ).range(from, from + 999);
  if (error) { console.error('query failed:', error.message); process.exit(1); }
  all = all.concat(data);
  if (data.length < 1000) break;
  from += 1000;
}

// ⚠️ "Years Reffing" holds TWO shapes: a bare number ("10", "2") from the Central
//    Assign import, and an already-formatted label ("Seas 2") from our own forms.
//    Number() on the second returns NaN — that blanked Bryce Quinn and Emily
//    Tessier out of the first version of this file. Same trap as the dog tags.
//    Never "Yr 0"/"Yr 1": first season is Seas 1, second is Seas 2, then Yr N.
const exp = v => {
  const s = String(v ?? '').trim();
  if (!s) return '';
  if (/^(seas|yr|year|season)/i.test(s)) return s.replace(/^season/i,'Seas').replace(/^year/i,'Yr');
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  return n <= 0 ? 'Seas 1' : n === 1 ? 'Seas 2' : `Yr ${n}`;
};

// "Club Preference" is a JSON-encoded array, not a plain string. Printing it raw
// put ["Griswold"] in front of Ed.
const clubs = v => {
  if (!v) return '';
  try { const a = JSON.parse(v); return Array.isArray(a) ? a.join('; ') : String(a); }
  catch { return String(v); }
};

const fmtPhone = p => {
  const d = String(p ?? '').replace(/\D/g,'').replace(/^1/,'');
  return d.length === 10 ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}` : String(p ?? '');
};
const q = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };

const rows = all
  .filter(r => TOWNS.some(t => String(r.city ?? '').trim().toLowerCase() === t.toLowerCase()))
  .sort((a,b) => String(a.city).localeCompare(String(b.city))
              || String(a.name).localeCompare(String(b.name)));

const HEAD = ['Town','Name','Experience','Age','Registered Through','Central Assign ID',
              'Certification','Clubs They Work','Email','Phone','Guardian','Guardian Email','Guardian Phone'];
const out = [HEAD.join(',')];
for (const r of rows) out.push([
  r.city, r.name, exp(r['Years Reffing']), r.age, r.registration_year, r['Central Assign ID'],
  r['Certification Level'], clubs(r['Club Preference']), r.email, fmtPhone(r.phone),
  r['Guardian Name'], r['Guardian Email'], fmtPhone(r['Guardian Phone'])
].map(q).join(','));

const byTown = {}; rows.forEach(r => byTown[r.city] = (byTown[r.city]||0)+1);
const empty  = TOWNS.filter(t => !byTown[t]);
const minors = rows.filter(r => Number(r.age) < 18);
const noG    = minors.filter(r => !r['Guardian Email'] && !r['Guardian Phone']);
const today  = new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});

out.push('');
out.push(q(`${rows.length} referees: ${Object.entries(byTown).map(([t,n])=>`${t} (${n})`).join(', ')}.`
  + (empty.length ? ` ${empty.join(' and ')} have none registered.` : '')));
out.push(q(`${minors.length} are under 18; guardian contact is on file for ${minors.length-noG.length}.`
  + (noG.length ? ` Still missing for ${noG.map(r=>`${r.name} (${r.age})`).join(', ')} — Central Assign has no guardian for them either.` : '')));
out.push(q('Experience: "Seas 1" is a first season, "Seas 2" a second, "Yr N" from the third on. Blank means Central Assign has not recorded it.'));
out.push(q(`Source: Referee Tool roster, mirrored from Central Assign. Generated ${today}.`));

fs.writeFileSync(OUT, out.join('\n') + '\n');
console.log(out.join('\n'));
console.log('\nwritten:', OUT);
