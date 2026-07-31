import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const { data: r } = await db.from('referees').select('id').limit(1);
console.log('referees.id sample:', JSON.stringify(r?.[0]?.id), '| typeof:', typeof r?.[0]?.id);

const { data: a, error: aErr } = await db.from('assignors').select('auth_user_id, clubs, name').limit(5);
if (aErr) console.log('assignors error:', aErr.message);
else a.forEach(x => console.log('assignor:', x.name, '| auth_user_id:', JSON.stringify(x.auth_user_id), '| clubs:', JSON.stringify(x.clubs)));
