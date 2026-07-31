import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

for (const t of ['referee_pools', 'pool_members']) {
    const { data, error, count } = await db.from(t).select('*', { count: 'exact' }).limit(1);
    console.log(error ? `${t}: ERROR ${error.message}` : `${t}: OK (rows: ${count})`);
}
const { data: r, error: rErr } = await db.from('referees').select('id, email_opt_in, sms_opt_in, unsubscribed_at').limit(1);
console.log(rErr ? `referees new cols: ERROR ${rErr.message}` : `referees new cols: OK`, r?.[0]);
