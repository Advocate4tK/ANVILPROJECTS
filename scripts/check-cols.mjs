import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');
for (const c of ['email_opt_in', 'sms_opt_in', 'unsubscribed_at']) {
    const { error } = await db.from('referees').select(`id, ${c}`).limit(1);
    console.log(`${c}: ${error ? 'MISSING/hidden -> ' + error.message : 'OK'}`);
}
