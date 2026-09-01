const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_secret_TSkG7wNpUcgIxnlcCSMD-A_EmMdHKsS');

async function run() {
    // Check venues table for RHAMBOREE venue names
    const { data: venues } = await supabase
        .from('venues')
        .select('"Venue Name", "Venue ID", id')
        .or('"Venue Name".ilike.%lions%,"Venue Name".ilike.%burnt%,"Venue Name".ilike.%blackledge%,"Venue Name".ilike.%farley%,"Venue Name".ilike.%hebron%,"Venue Name".ilike.%marlborough%');

    console.log('Matching venues:');
    (venues || []).forEach(v => console.log(`  id=${v.id}  CA_ID=${v['Venue ID']}  name="${v['Venue Name']}"`));

    // Check field text values on our inserted games
    const { data: fieldVals } = await supabase
        .from('tournament_games')
        .select('field')
        .eq('Source Club', 'RHAMBOREE');

    const unique = [...new Set((fieldVals || []).map(r => r.field))].sort();
    console.log('\nDistinct field values in tournament_games:');
    unique.forEach(v => console.log('  ' + v));
}
run().catch(console.error);
