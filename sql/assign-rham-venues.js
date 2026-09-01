const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kaniccdqieyesezpousu.supabase.co', 'sb_secret_TSkG7wNpUcgIxnlcCSMD-A_EmMdHKsS');

// field text prefix → { venueId (CA numeric), clean field name }
const MAP = [
    { prefix: 'Lions',      venueId: 1046, fieldPrefix: 'Field ' },
    { prefix: 'Burnt Hill', venueId: 577,  fieldPrefix: 'Field ' },
    { prefix: 'Blackledge', venueId: 648,  fieldPrefix: 'Field ' },
    { prefix: 'Farley',     venueId: 572,  fieldPrefix: 'Field ' },
];

// "Lions A" → venue 1046, field "Field A"
// "Burnt Hill B" → venue 577, field "Field B"
function resolve(fieldText) {
    for (const m of MAP) {
        if (fieldText && fieldText.startsWith(m.prefix)) {
            const letter = fieldText.slice(m.prefix.length).trim(); // "A", "B", etc.
            return { venueId: m.venueId, fieldName: m.fieldPrefix + letter };
        }
    }
    return null;
}

async function run() {
    const { data: games, error } = await supabase
        .from('tournament_games')
        .select('id, field')
        .eq('Source Club', 'RHAMBOREE');

    if (error) { console.error(error); process.exit(1); }

    console.log(`Found ${games.length} RHAMBOREE games. Updating venues...`);

    let updated = 0, skipped = 0;
    for (const g of games) {
        const r = resolve(g.field);
        if (!r) { console.warn(`  No match for field="${g.field}" (id=${g.id})`); skipped++; continue; }

        const { error: ue } = await supabase
            .from('tournament_games')
            .update({ 'Venue ID': r.venueId, field: r.fieldName })
            .eq('id', g.id);

        if (ue) { console.error(`  id=${g.id} error:`, ue.message); }
        else updated++;
    }

    console.log(`\nDone. Updated: ${updated}  Skipped: ${skipped}`);

    // Verify
    const { data: check } = await supabase
        .from('tournament_games')
        .select('field, "Venue ID"')
        .eq('Source Club', 'RHAMBOREE')
        .limit(6);
    console.log('\nSample:');
    check.forEach(r => console.log(`  field="${r.field}"  Venue ID=${r['Venue ID']}`));
}
run().catch(console.error);
