// ─────────────────────────────────────────────────────────────────────────────
// CT regions + village aliases for the Referee Blasts map.
//
// REGIONS: default groupings, built on Connecticut's eight historic counties
// because that is still how assignors talk about the state. Editable at runtime
// (blast-map.html stores overrides in localStorage under ctRegionOverrides), so
// nothing here is load-bearing — it is a starting line, not a decision.
//
// ALIASES: CT towns contain villages that carry their own name and ZIP. A ref
// who writes "Rockville" lives in Vernon; "Jewett City" is Griswold. Without
// this table those refs resolve to no town at all and vanish from the map.
// ─────────────────────────────────────────────────────────────────────────────

window.CT_REGIONS = {
    'Northwest': {
        color: '#7c6cd6',
        towns: ['Barkhamsted','Bethlehem','Bridgewater','Canaan','Colebrook','Cornwall','Goshen','Harwinton','Kent','Litchfield','Morris','New Hartford','New Milford','Norfolk','North Canaan','Plymouth','Roxbury','Salisbury','Sharon','Thomaston','Torrington','Warren','Washington','Watertown','Winchester','Woodbury']
    },
    'Hartford / Central': {
        color: '#d98f2b',
        towns: ['Avon','Berlin','Bloomfield','Bristol','Burlington','Canton','East Granby','East Hartford','East Windsor','Enfield','Farmington','Glastonbury','Granby','Hartford','Hartland','Manchester','Marlborough','New Britain','Newington','Plainville','Rocky Hill','Simsbury','South Windsor','Southington','Suffield','West Hartford','Wethersfield','Windsor','Windsor Locks']
    },
    // NOTE: no region may use green. #00c853 means "selected" everywhere in this
    // tool — a green region would be indistinguishable from a chosen one.
    'Northeast': {
        color: '#4a6fd0',
        towns: ['Andover','Ashford','Bolton','Brooklyn','Canterbury','Chaplin','Columbia','Coventry','Eastford','Ellington','Hampton','Hebron','Killingly','Mansfield','Plainfield','Pomfret','Putnam','Scotland','Somers','Stafford','Sterling','Thompson','Tolland','Union','Vernon','Willington','Windham','Woodstock']
    },
    'Southeast': {
        color: '#c2564e',
        towns: ['Bozrah','Colchester','East Lyme','Franklin','Griswold','Groton','Lebanon','Ledyard','Lisbon','Lyme','Montville','New London','North Stonington','Norwich','Old Lyme','Preston','Salem','Sprague','Stonington','Voluntown','Waterford']
    },
    // Middlesex County — the river towns + shoreline. Kept separate from New Haven
    // because this is live territory (East Haddam, Durham, Portland, Clinton, Essex).
    'Shoreline': {
        color: '#c98bbf',
        towns: ['Chester','Clinton','Cromwell','Deep River','Durham','East Haddam','East Hampton','Essex','Haddam','Killingworth','Middlefield','Middletown','Old Saybrook','Portland','Westbrook']
    },
    'South Central': {
        color: '#5fb3c9',
        towns: ['Ansonia','Beacon Falls','Bethany','Branford','Cheshire','Derby','East Haven','Guilford','Hamden','Madison','Meriden','Middlebury','Milford','Naugatuck','New Haven','North Branford','North Haven','Orange','Oxford','Prospect','Seymour','Southbury','Wallingford','Waterbury','West Haven','Wolcott','Woodbridge']
    },
    'Southwest': {
        color: '#9a8f6a',
        towns: ['Bethel','Bridgeport','Brookfield','Danbury','Darien','Easton','Fairfield','Greenwich','Monroe','New Canaan','New Fairfield','Newtown','Norwalk','Redding','Ridgefield','Shelton','Sherman','Stamford','Stratford','Trumbull','Weston','Westport','Wilton']
    }
};

// village / borough / CDP  ->  the town it actually belongs to
window.CT_TOWN_ALIASES = {
    // Eastern CT — the territory we actually assign in
    'rockville': 'Vernon',
    'danielson': 'Killingly',
    'dayville': 'Killingly',
    'ballouville': 'Killingly',
    'attawaugan': 'Killingly',
    'rogers': 'Killingly',
    'jewett city': 'Griswold',
    'glasgo': 'Griswold',
    'pachaug': 'Griswold',
    'willimantic': 'Windham',
    'south windham': 'Windham',
    'north windham': 'Windham',
    'moosup': 'Plainfield',
    'central village': 'Plainfield',
    'wauregan': 'Plainfield',
    'plainfield village': 'Plainfield',
    'woodstock valley': 'Woodstock',
    'east woodstock': 'Woodstock',
    'south woodstock': 'Woodstock',
    'north woodstock': 'Woodstock',
    'abington': 'Pomfret',
    'elliott': 'Pomfret',
    'east killingly': 'Killingly',
    'south killingly': 'Killingly',
    'oneco': 'Sterling',
    'south coventry': 'Coventry',
    'north franklin': 'Franklin',
    'westford': 'Ashford',
    'warrenville': 'Ashford',
    'eagleville': 'Mansfield',
    'south willington': 'Willington',
    'west willington': 'Willington',
    'staffordville': 'Stafford',
    'west stafford': 'Stafford',
    'hadlyme': 'East Haddam',
    'westchester': 'Colchester',
    'north westchester': 'Colchester',
    'gilead': 'Hebron',
    'buckingham': 'Glastonbury',
    'poquonock bridge': 'Groton',
    'groton long point': 'Groton',
    'west mystic': 'Groton',
    'mashantucket': 'Ledyard',
    'flanders': 'East Lyme',
    'north grosvenordale': 'Thompson',
    'grosvenordale': 'Thompson',
    'quinebaug': 'Thompson',
    'wilsonville': 'Thompson',
    'storrs': 'Mansfield',
    'storrs mansfield': 'Mansfield',
    'mansfield center': 'Mansfield',
    'mansfield depot': 'Mansfield',
    'baltic': 'Sprague',
    'versailles': 'Sprague',
    'hanover': 'Sprague',
    'taftville': 'Norwich',
    'yantic': 'Norwich',
    'occum': 'Norwich',
    'gales ferry': 'Ledyard',
    'quaker hill': 'Waterford',
    'uncasville': 'Montville',
    'oakdale': 'Montville',
    'niantic': 'East Lyme',
    'pawcatuck': 'Stonington',
    'mystic': 'Groton',          // straddles Groton/Stonington — Groton is the better default
    'old mystic': 'Stonington',
    'noank': 'Groton',
    'fitchville': 'Bozrah',
    'gilman': 'Bozrah',
    'amston': 'Hebron',
    'moodus': 'East Haddam',
    'cobalt': 'East Hampton',
    'middle haddam': 'East Hampton',
    'higganum': 'Haddam',
    'ivoryton': 'Essex',
    'centerbrook': 'Essex',
    'stafford springs': 'Stafford',
    'somersville': 'Somers',
    'crystal lake': 'Ellington',
    'south glastonbury': 'Glastonbury',

    // Rest of the state — less traffic, but they cost nothing to carry
    'thompsonville': 'Enfield',
    'hazardville': 'Enfield',
    'broad brook': 'East Windsor',
    'poquonock': 'Windsor',
    'collinsville': 'Canton',
    'unionville': 'Farmington',
    'weatogue': 'Simsbury',
    'tariffville': 'Simsbury',
    'west simsbury': 'Simsbury',
    'kensington': 'Berlin',
    'east berlin': 'Berlin',
    'marion': 'Southington',
    'milldale': 'Southington',
    'plantsville': 'Southington',
    'pequabuck': 'Bristol',
    'forestville': 'Bristol',
    'terryville': 'Plymouth',
    'winsted': 'Winchester',
    'bantam': 'Litchfield',
    'northfield': 'Litchfield',
    'falls village': 'Canaan',
    'lakeville': 'Salisbury',
    'lime rock': 'Salisbury',
    'taconic': 'Salisbury',
    'west cornwall': 'Cornwall',
    'cornwall bridge': 'Cornwall',
    'south kent': 'Kent',
    'gaylordsville': 'New Milford',
    'northville': 'New Milford',
    'new preston': 'Washington',
    'marbledale': 'Washington',
    'pleasant valley': 'Barkhamsted',
    'riverton': 'Barkhamsted',
    'oakville': 'Watertown',
    'lakeside': 'Morris',
    'northford': 'North Branford',
    'short beach': 'Branford',
    'pine orchard': 'Branford',
    'stony creek': 'Branford',
    'whitneyville': 'Hamden',
    'mount carmel': 'Hamden',
    'devon': 'Milford',
    'woodmont': 'Milford',
    'sandy hook': 'Newtown',
    'botsford': 'Newtown',
    'stevenson': 'Monroe',
    'stepney': 'Monroe',
    'long hill': 'Trumbull',
    'nichols': 'Trumbull',
    'georgetown': 'Redding',
    'cos cob': 'Greenwich',
    'old greenwich': 'Greenwich',
    'riverside': 'Greenwich',
    'byram': 'Greenwich'
};
