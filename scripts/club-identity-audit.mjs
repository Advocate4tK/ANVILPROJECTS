// READ ONLY. Every place a club is referenced by string, lined up against the
// clubs table, so we can see exactly what a rename would break.
import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const [clubs, games, assignors, events] = await Promise.all([
  db.from('clubs').select('id,name,"Club Name","Display Name",enabled').then(r => r.data || []),
  db.from('games').select('"Source Club"').then(r => r.data || []),
  db.from('assignors').select('*').then(r => r.data || []),
  db.from('events').select('"Club Name"').then(r => r.data || []),
]);

const gameClubs = {};
games.forEach(g => { const k = g['Source Club']; if (k) gameClubs[k] = (gameClubs[k] || 0) + 1; });
const eventNames = new Set(events.map(e => e['Club Name']).filter(Boolean));

console.log('=== clubs table vs what games actually carry ===');
console.log('name'.padEnd(30) + 'Club Name'.padEnd(26) + 'games under `name`'.padEnd(20) + 'enabled');
console.log('-'.repeat(88));
clubs.forEach(c => {
  const exact = gameClubs[c.name] || 0;
  console.log(String(c.name).padEnd(30) + String(c['Club Name'] ?? '—').padEnd(26) +
              String(exact).padEnd(20) + c.enabled);
});

console.log('\n=== Source Club values in games with NO exact club row ===');
Object.entries(gameClubs).sort((a,b)=>b[1]-a[1]).forEach(([k, n]) => {
  if (clubs.some(c => c.name === k)) return;
  if (eventNames.has(k)) { console.log(`  ${String(k).padEnd(28)} ${String(n).padStart(4)} games  (EVENT — fine)`); return; }
  const ci = clubs.find(c => (c.name || '').toLowerCase() === k.toLowerCase());
  const cn = clubs.find(c => (c['Club Name'] || '') === k);
  const slug = clubs.find(c => (c.name || '').replace(/-/g, ' ').toLowerCase() === k.toLowerCase());
  const why = ci ? `case-only mismatch with club "${ci.name}"`
            : cn ? `matches "Club Name" of club "${cn.name}"`
            : slug ? `slug form of club "${slug.name}"`
            : 'NO MATCHING CLUB AT ALL';
  console.log(`  ${String(k).padEnd(28)} ${String(n).padStart(4)} games  -> ${why}`);
});

console.log('\n=== assignor.clubs arrays (renaming a club breaks these) ===');
assignors.forEach(a => {
  const list = a['Clubs'] || a.clubs;
  console.log(`  ${String(a['Name'] || a.name).padEnd(16)} ${JSON.stringify(list)}`);
  (Array.isArray(list) ? list : []).forEach(n => {
    const ok = clubs.some(c => c.name === n) || eventNames.has(n);
    if (!ok) console.log(`      ⚠ "${n}" matches no club row and no event`);
  });
});

console.log('\n=== other tables holding a club string ===');
for (const [tbl, col] of [['pay_rates','club_id'], ['referees','source_club'], ['availability','assignor_id']]) {
  const { data, error } = await db.from(tbl).select('*').limit(1);
  if (error) { console.log(`  ${tbl}: ${error.message}`); continue; }
  const cols = Object.keys(data?.[0] || {}).filter(k => /club/i.test(k));
  console.log(`  ${tbl}: club-ish columns -> ${cols.join(', ') || '(none)'}`);
}
