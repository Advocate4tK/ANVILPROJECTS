// Backfill gender for the Enfield referees where Central Assign actually
// DISPLAYED a Male/Female badge. CA only badges some rows — the rest showed
// nothing but "Minor", and guessing gender from a first name is exactly the
// kind of confident mistake that puts wrong data in front of a client.
//
// Column is "Gender" (Title Case). Writing lowercase 'gender' throws a
// Supabase schema-cache error — see POSTGRES_STATE.
import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const SEEN = [
  { ca_id: 893,   name: 'Dean Myshrall',    gender: 'Male' },
  { ca_id: 801,   name: 'Jeremy Scheer',    gender: 'Male' },
  { ca_id: 38847, name: 'Parker Wasileski', gender: 'Male' },
];

for (const s of SEEN) {
  const { data: rows } = await db.from('referees')
    .select('id,name,"Gender"').eq('Central Assign ID', s.ca_id);
  if (!rows || !rows.length) { console.log(`  ${s.name}: NOT FOUND`); continue; }
  const r = rows[0];
  if (r['Gender']) { console.log(`  ${s.name}: already ${r['Gender']}, left alone`); continue; }
  const { error } = await db.from('referees').update({ 'Gender': s.gender }).eq('id', r.id);
  console.log(error ? `  ${s.name}: FAILED ${error.message}`
                    : `  ${s.name}: set ${s.gender}`);
}

const { data: all } = await db.from('referees').select('id,"Gender"').ilike('city', 'enfield%');
console.log('\nEnfield with gender on file:', all.filter(r => r['Gender']).length, 'of', all.length);
console.log('The remaining ones had no gender badge shown in Central Assign.');
