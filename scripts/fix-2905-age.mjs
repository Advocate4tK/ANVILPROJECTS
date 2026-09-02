// Normalize game 2905's Age Group. Its four siblings at Nathan Hale-Ray are
// spelled "U19", "U19", "U19" and "U19 HS"; this one is "U19 High School".
// The workstation age filter (assignor-workstation.html:6946) is an exact
// string match, and AGE_ORDER has no entry for it either.
// No effect on the CA export — that strips everything after the first space.
import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const { data: before } = await db.from('games')
  .select('id,"Age Group","Home Team","Away Team",date').eq('id', 2905).single();
console.log('before:', JSON.stringify(before));

const { data, error } = await db.from('games')
  .update({ 'Age Group': 'U19' }).eq('id', 2905).select('id,"Age Group"');

if (error) { console.log('UPDATE FAILED:', error.message); process.exit(1); }
console.log('after :', JSON.stringify(data));

// show all five Nathan Hale-Ray games so the spread is visible
const { data: all } = await db.from('games')
  .select('id,date,"Age Group","Center Referee","AR 1","AR 2"')
  .eq('Venue ID', 711).order('date');
console.log('\nall Nathan Hale-Ray games:');
(all || []).forEach(g => console.log(
  `  ${g.date}  id ${g.id}  age ${JSON.stringify(g['Age Group']).padEnd(12)}` +
  `  CR ${JSON.stringify(g['Center Referee'])}  AR2 ${JSON.stringify(g['AR 2'])}`));
