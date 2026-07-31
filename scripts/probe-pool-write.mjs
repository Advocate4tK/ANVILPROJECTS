import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

// insert a test pool
const { data: ins, error: insErr } = await db.from('referee_pools')
    .insert({ name: '__write_probe__', owner_uid: '271a64f2-8704-4183-8547-026130a343e6' })
    .select().single();
if (insErr) { console.log('INSERT: DENIED ->', insErr.message); process.exit(0); }
console.log('INSERT: OK -> id', ins.id);

// insert a member
const { error: mErr } = await db.from('pool_members').insert({ pool_id: ins.id, referee_id: 1172 });
console.log(mErr ? `MEMBER INSERT: DENIED -> ${mErr.message}` : 'MEMBER INSERT: OK');

// clean up
const { error: dmErr } = await db.from('pool_members').delete().eq('pool_id', ins.id);
const { error: dErr }  = await db.from('referee_pools').delete().eq('id', ins.id);
console.log(dErr || dmErr ? `CLEANUP: problem -> ${(dErr||dmErr).message}` : 'CLEANUP: OK (probe rows removed)');
