import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');
const CARD = 'cardRefBlasts';

const { data, error } = await db.from('assignors').select('auth_user_id, name, role, permissions');
if (error) { console.log('Read error:', error.message); process.exit(1); }

for (const a of data) {
    if (a.role === 'Admin') { console.log(`skip ${a.name} (Admin sees all)`); continue; }
    const cur = Array.isArray(a.permissions) ? a.permissions : ['cardWorkstation'];
    if (cur.includes(CARD)) { console.log(`${a.name}: already has ${CARD}`); continue; }
    const next = [...cur, CARD];
    const { error: uErr } = await db.from('assignors').update({ permissions: next }).eq('auth_user_id', a.auth_user_id);
    console.log(uErr ? `${a.name}: UPDATE FAILED -> ${uErr.message}` : `${a.name}: granted -> ${JSON.stringify(next)}`);
}
