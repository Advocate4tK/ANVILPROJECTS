import { createClient } from '@supabase/supabase-js';
const db = createClient('https://kaniccdqieyesezpousu.supabase.co','sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const { data } = await db.from('games').select('id, "Venue ID", field, notes').eq('"Source Club"','NECONN').eq('game_type','Rec').order('"Venue ID"');
const byVenue = {};
data.forEach(g => {
    const v = g['Venue ID'] || 'null';
    if (!byVenue[v]) byVenue[v] = [];
    byVenue[v].push(g.field);
});
for (const [v, fields] of Object.entries(byVenue)) {
    const unique = [...new Set(fields)];
    console.log(`Venue ID ${v}: field values → ${JSON.stringify(unique)}`);
}
