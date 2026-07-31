import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const { data: refs, error: refErr } = await db.from('referees').select('*').limit(2);
if (refErr) console.log('referees error:', refErr.message);
else console.log('\n=== referees columns ===\n', Object.keys(refs[0] || {}));

const { data: avail, error: availErr } = await db.from('availability').select('*').limit(2);
if (availErr) console.log('availability error:', availErr.message);
else {
    console.log('\n=== availability columns ===\n', Object.keys(avail[0] || {}));
    if (avail[0]) console.log('sample row:', JSON.stringify(avail[0], null, 2));
}
