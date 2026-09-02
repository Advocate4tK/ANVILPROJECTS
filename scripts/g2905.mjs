import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const { data: g } = await db.from('games').select('*').eq('id', 2905).single();
console.log('=== full row, game 2905 ===');
Object.entries(g).forEach(([k, v]) => {
  if (v !== null && v !== '' && v !== undefined) console.log(`  ${k.padEnd(22)} ${JSON.stringify(v)}`);
});
console.log('  --- null/empty ---');
console.log('  ' + Object.entries(g).filter(([, v]) => v === null || v === '').map(([k]) => k).join(', '));

// 2955 for comparison — the one that kept Jack Nelan
const { data: g2 } = await db.from('games').select('*').eq('id', 2955).single();
console.log('\n=== game 2955 (Jul 29, has Jack Nelan) ===');
Object.entries(g2).forEach(([k, v]) => {
  if (v !== null && v !== '' && v !== undefined) console.log(`  ${k.padEnd(22)} ${JSON.stringify(v)}`);
});

// Jack Nelan's referee record + anything referencing him
const { data: ref } = await db.from('referees').select('id,"Name",email,"Central Assign ID"').ilike('Name', '%nelan%');
console.log('\n=== referee match "nelan" ===');
(ref || []).forEach(r => console.log('  ', JSON.stringify(r)));

// any schedule change touching this game / date
for (const tbl of ['schedule_changes', 'change_requests']) {
  const { data, error } = await db.from(tbl).select('*').limit(200);
  if (error) { console.log(`\n${tbl}: ${error.message}`); continue; }
  const hits = (data || []).filter(r => /2905|08[-/]05|2026-08-05|Valley|Nathan Hale/i.test(JSON.stringify(r)));
  console.log(`\n${tbl}: ${data.length} rows, ${hits.length} mentioning this game`);
  hits.slice(0, 5).forEach(r => console.log('   ', JSON.stringify(r).slice(0, 400)));
}

// payments referencing 2905
const { data: pay } = await db.from('ref_payments').select('*').eq('game_id', 2905);
console.log(`\nref_payments rows for game 2905: ${pay ? pay.length : 0}`);
(pay || []).forEach(p => console.log('   ', JSON.stringify(p).slice(0, 300)));
