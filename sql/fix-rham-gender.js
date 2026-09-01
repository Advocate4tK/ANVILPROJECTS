const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_secret_TSkG7wNpUcgIxnlcCSMD-A_EmMdHKsS');

async function run() {
    const { data: games, error } = await supabase
        .from('tournament_games')
        .select('id, "Age Group"')
        .eq('Source Club', 'RHAMBOREE');

    if (error) { console.error(error); process.exit(1); }
    console.log(`Found ${games.length} RHAMBOREE games. Setting Gender...`);

    let boys = 0, girls = 0, skipped = 0;
    for (const g of games) {
        const ag = g['Age Group'] || '';
        const gender = ag.includes('Girls') ? 'Girls' : ag.includes('Boys') ? 'Boys' : null;
        if (!gender) { skipped++; continue; }

        const { error: ue } = await supabase
            .from('tournament_games')
            .update({ Gender: gender })
            .eq('id', g.id);

        if (ue) { console.error(`  id=${g.id} error:`, ue.message); }
        else { gender === 'Girls' ? girls++ : boys++; }
    }

    console.log(`\nDone. Boys: ${boys}  Girls: ${girls}  Skipped: ${skipped}`);
}
run().catch(console.error);
