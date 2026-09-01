// Geocode venue addresses into lat/lng so the map can drop a real pin per venue
// instead of stacking them all on the town centroid.
//
//   node scripts/geocode-venues.mjs           preview, writes nothing
//   node scripts/geocode-venues.mjs --write   save results
//
// Uses OpenStreetMap Nominatim. Free, no key, but their usage policy is 1
// request per second and a real User-Agent — both respected below. Roughly two
// minutes for 95 venues. Only geocodes rows that have no lat yet, so re-running
// is cheap and safe.
//
// The addresses sent are public venue addresses — schools, parks, town fields.
// No personal data leaves the machine.

const KEY = 'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb';
const URL = 'https://kaniccdqieyesezpousu.supabase.co';
const H   = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };

const WRITE = process.argv.includes('--write');
const UA    = 'referee-tool venue geocoder (tod@anvil-arts.com)';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// CT bounding box. Nominatim will happily hand back a same-named street in
// another state; anything outside this is rejected rather than stored.
const CT_BOUNDS = { minLat: 40.95, maxLat: 42.06, minLng: -73.75, maxLng: -71.78 };

function inCT(lat, lng) {
    return lat >= CT_BOUNDS.minLat && lat <= CT_BOUNDS.maxLat
        && lng >= CT_BOUNDS.minLng && lng <= CT_BOUNDS.maxLng;
}

async function geocode(q) {
    const u = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q='
            + encodeURIComponent(q);
    const r = await fetch(u, { headers: { 'User-Agent': UA } });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j.length) return null;
    return { lat: parseFloat(j[0].lat), lng: parseFloat(j[0].lon) };
}

(async () => {
    const res = await fetch(URL + '/rest/v1/venues?select=id,rt_code,"Venue Name",address,city,state,zip,lat,lng',
                            { headers: H });
    const venues = await res.json();
    if (venues.code) {
        console.error('❌ ' + venues.message);
        console.error('   Run sql/venue_latlng.sql and sql/venue_latlng_2.sql first.');
        process.exit(1);
    }

    const todo = venues.filter(v => v.lat == null || v.lng == null);
    console.log(`${venues.length} venues · ${venues.length - todo.length} already located · ${todo.length} to geocode`);
    if (!todo.length) return;
    if (!WRITE) console.log('PREVIEW — nothing will be saved. Re-run with --write.\n');

    let ok = 0, failed = [];
    for (const v of todo) {
        // Street address first; fall back to town so a venue with no street
        // still lands in the right place rather than nowhere.
        const attempts = [
            [v.address, v.city, v.state, v.zip].filter(Boolean).join(', '),
            [v['Venue Name'], v.city, v.state].filter(Boolean).join(', '),
            [v.city, v.state].filter(Boolean).join(', ')
        ].filter(s => s && s.length > 4);

        let hit = null, usedFallback = false;
        for (let i = 0; i < attempts.length; i++) {
            await sleep(1100);                       // Nominatim: 1 req/sec
            const g = await geocode(attempts[i]);
            if (g && inCT(g.lat, g.lng)) { hit = g; usedFallback = i > 0; break; }
        }

        if (!hit) { failed.push(v); console.log(`   ✗ ${v.rt_code}  ${v['Venue Name']}`); continue; }

        ok++;
        console.log(`   ${usedFallback ? '~' : '✓'} ${v.rt_code}  ${String(v['Venue Name']).padEnd(34)}`
                  + ` ${hit.lat.toFixed(5)}, ${hit.lng.toFixed(5)}${usedFallback ? '  (approx — no street match)' : ''}`);

        if (WRITE) {
            await fetch(URL + '/rest/v1/venues?id=eq.' + v.id, {
                method: 'PATCH', headers: H,
                body: JSON.stringify({ lat: hit.lat, lng: hit.lng })
            });
        }
    }

    console.log(`\nlocated ${ok} · failed ${failed.length}`);
    if (failed.length) {
        console.log('these need a lat/lng by hand:');
        failed.forEach(v => console.log(`   ${v.rt_code}  ${v['Venue Name']} — ${[v.address, v.city].filter(Boolean).join(', ') || 'no address'}`));
    }
    if (!WRITE) console.log('\nnothing was saved. re-run with --write');
})();
