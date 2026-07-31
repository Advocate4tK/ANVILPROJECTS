import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');
const { data, error } = await db.from('assignors').select('auth_user_id, name, role, permissions').order('name');
if (error) { console.log('Error:', error.message); process.exit(1); }
data.forEach(a => console.log(`${(a.name||'?').padEnd(16)} | role=${a.role||'—'} | perms=${JSON.stringify(a.permissions)}`));
