import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');
const CARD = 'cardRefBlasts';
const KEEP = ['tod', 'admin'];   // names (lowercased) that should HAVE the card

const { data, error } = await db.from('assignors').select('auth_user_id, name, role, permissions');
if (error) { console.log('Read error:', error.message); process.exit(1); }

for (const a of data) {
    const cur = Array.isArray(a.permissions) ? a.permissions : ['cardWorkstation'];
    const shouldHave = KEEP.includes((a.name || '').trim().toLowerCase());
    const hasIt = cur.includes(CARD);
    let next = null;
    if (shouldHave && !hasIt) next = [...cur, CARD];
    else if (!shouldHave && hasIt) next = cur.filter(c => c !== CARD);
    if (!next) { console.log(`${a.name}: OK (no change) -> ${JSON.stringify(cur)}`); continue; }
    const { error: uErr } = await db.from('assignors').update({ permissions: next }).eq('auth_user_id', a.auth_user_id);
    console.log(uErr ? `${a.name}: FAILED -> ${uErr.message}` : `${a.name}: set -> ${JSON.stringify(next)}`);
}
