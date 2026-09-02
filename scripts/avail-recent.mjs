import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const { data } = await db.from('availability')
  .select('id,"Referee Name",date,notes,event_slug,tournament_key,assignor_id,created_at,"Submitted At"')
  .order('created_at', { ascending: false }).limit(30);

console.log('30 most recent availability submissions\n');
console.log('id    submitted         game date   event_slug                  referee              notes');
console.log('-'.repeat(140));
(data || []).forEach(r => console.log(
  String(r.id).padEnd(6) +
  String(r.created_at || '').slice(0, 16).replace('T', ' ').padEnd(18) +
  String(r.date || '').padEnd(12) +
  String(r.event_slug ?? '(null)').padEnd(28) +
  String(r['Referee Name'] || '').padEnd(21) +
  String(r.notes || '').slice(0, 55)
));
