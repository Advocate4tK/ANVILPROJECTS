/**
 * Central Assign Export
 * Pulls games from Airtable and generates a tab-delimited file
 * formatted for Central Assign import.
 */

// VENUE_LOOKUP is no longer hardcoded — CA venue IDs are read directly
// from the Airtable Venues table (Venue ID field) at load time.

// ── Default values for Central Assign fields ──────────────────────────────────
const DEFAULTS = {
    type:         'League',
    gender:       'F',
    league:       21,
    diagSysCtl:   1,
    refRate:      40,
    arRate:       25,
    fourthRate:   0,
    assessorRate: 0
};

// ── Period lengths by age group ────────────────────────────────────────────────
// durationTime = (2 × period) + halftime  (U8/U10/U12 = 5 min HT, U13/U15/U19 = 10 min HT)
const DURATION_BY_AGE = {
    'U8':  { duration: '2 x 20', durationTime: 45  },  // 40 + 5
    'U10': { duration: '2 x 30', durationTime: 65  },  // 60 + 5
    'U12': { duration: '2 x 35', durationTime: 75  },  // 70 + 5
    'U13': { duration: '2 x 40', durationTime: 90  },  // 80 + 10  (comp — same as U15)
    'U15': { duration: '2 x 40', durationTime: 90  },  // 80 + 10
    'U16': { duration: '2 x 40', durationTime: 90  },  // 80 + 10  (same as U15)
    'U19': { duration: '2 x 45', durationTime: 100 },  // 90 + 10
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const loadBtn        = document.getElementById('loadBtn');
const exportBtn      = document.getElementById('exportBtn');
const selectAllBtn   = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const gamesSection   = document.getElementById('gamesSection');
const gamesTable     = document.getElementById('gamesTable');
const gameCount      = document.getElementById('gameCount');
const noGamesMsg     = document.getElementById('noGamesMsg');
const limitWarning   = document.getElementById('limitWarning');
const progressWrap   = document.getElementById('progressWrap');
const progressBar    = document.getElementById('progressBar');
const progressText   = document.getElementById('progressText');

let loadedGames = [];
let refIdLookup        = {}; // Supabase ref ID (int) or lowercase name → CA numeric ID
let venueCAId          = {}; // Supabase record ID → CA venue ID (legacy fallback)
let venueNameMap       = {}; // Supabase record ID → venue name (legacy fallback)
let fieldNameMap       = {}; // Supabase record ID → field name (legacy fallback)
let numericVenueToName = {}; // numeric Venue ID → venue name (primary)
let numericFieldToName = {}; // numeric Field ID → field name (primary)

// ── Mode toggle — show only the selected filter panel ─────────────────────────
document.querySelectorAll('input[name="filterMode"]').forEach(radio => {
    radio.addEventListener('change', function() {
        document.getElementById('panelWeek').style.display  = this.value === 'week'  ? 'block' : 'none';
        document.getElementById('panelRange').style.display = this.value === 'range' ? 'block' : 'none';
        // Clear dates when switching modes
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value   = '';
        document.getElementById('weekRangeDisplay').textContent = '';
        document.getElementById('pickMonth').value = '';
        document.getElementById('pickWeek').value  = '';
    });
});

// ── Week picker — month + week dropdowns auto-fill Mon–Sun ────────────────────
function applyWeekPicker() {
    const monthVal = document.getElementById('pickMonth').value;
    const weekVal  = document.getElementById('pickWeek').value;
    if (monthVal === '' || weekVal === '') return;

    const year  = new Date().getFullYear();
    const month = parseInt(monthVal);
    const week  = parseInt(weekVal);

    // Find first Monday of the month
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay(); // 0=Sun,1=Mon...
    const daysToMon = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
    const firstMon  = new Date(year, month, 1 + daysToMon);

    // Week N = firstMon + (N-1)*7 days
    const mon = new Date(firstMon);
    mon.setDate(firstMon.getDate() + (week - 1) * 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    const fmt = dt => dt.toISOString().split('T')[0];
    const display = dt => dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    document.getElementById('dateFrom').value = fmt(mon);
    document.getElementById('dateTo').value   = fmt(sun);
    document.getElementById('weekRangeDisplay').textContent = `${display(mon)} — ${display(sun)}`;
}

document.getElementById('pickMonth').addEventListener('change', applyWeekPicker);
document.getElementById('pickWeek').addEventListener('change',  applyWeekPicker);

// Auto-fill Date To when Date From is picked and Date To is empty
document.getElementById('dateFrom').addEventListener('change', function() {
    const dateTo = document.getElementById('dateTo');
    if (!dateTo.value) dateTo.value = this.value;
});

// ── Load clubs into checkboxes ────────────────────────────────────────────────
async function loadClubCheckboxes() {
    if (!airtableClient) return;
    try {
        const clubs = await airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.CLUBS, { maxRecords: 200 });
        const names = clubs
            .map(c => c.fields['Club Name'] || c.fields['club_name'] || c.fields['Name'] || c.fields['name'] || '')
            .filter(Boolean)
            .sort();
        const wrap = document.getElementById('clubCheckboxes');
        if (!names.length) {
            wrap.innerHTML = '<span style="color:#e67e22; font-size:13px;">No clubs found — check clubs table.</span>';
            return;
        }
        wrap.innerHTML = names.map(n => `
            <label style="display:flex; align-items:center; gap:6px; font-weight:500; cursor:pointer; white-space:nowrap;">
                <input type="checkbox" class="club-cb" value="${n}" checked> ${n}
            </label>`).join('');
    } catch(e) {
        document.getElementById('clubCheckboxes').innerHTML =
            `<span style="color:#e74c3c; font-size:13px;">Could not load clubs: ${e.message}</span>`;
    }
}
loadClubCheckboxes();

document.getElementById('clubSelectAll').addEventListener('click', () =>
    document.querySelectorAll('.club-cb').forEach(cb => cb.checked = true));
document.getElementById('clubClearAll').addEventListener('click', () =>
    document.querySelectorAll('.club-cb').forEach(cb => cb.checked = false));

// ── Load Games ────────────────────────────────────────────────────────────────
loadBtn.addEventListener('click', async () => {
    if (!airtableClient) {
        alert('Database not connected. Check config.js.');
        return;
    }

    const dateFrom     = document.getElementById('dateFrom').value;
    const dateTo       = document.getElementById('dateTo').value;
    const selectedClubs = Array.from(document.querySelectorAll('.club-cb:checked')).map(cb => cb.value);

    loadBtn.disabled = true;
    progressWrap.style.display = 'block';
    progressBar.style.width = '50%';
    progressText.style.display = 'block';
    progressText.textContent = 'Loading games...';
    gamesSection.style.display = 'none';
    noGamesMsg.style.display = 'none';

    try {
        // Build date filter only — club filtering is done client-side to avoid
        // Airtable formula quoting issues with club names
        const dateParts = [];
        if (dateFrom) dateParts.push(`NOT(IS_BEFORE({Date}, '${dateFrom}'))`);
        if (dateTo)   dateParts.push(`NOT(IS_AFTER({Date}, '${dateTo}'))`);

        let filter = '';
        if (dateParts.length === 1)    filter = dateParts[0];
        else if (dateParts.length > 1) filter = `AND(${dateParts.join(', ')})`;

        const options = { maxRecords: 500 };
        if (filter) options.filterByFormula = filter;

        // Load games, referee CA IDs, venues, and fields in parallel
        progressText.textContent = 'Loading games, referees, venues, and fields...';
        const [records, referees, venues, fieldRecs] = await Promise.all([
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.GAMES,    options),
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.REFEREES, { maxRecords: 1000 }),
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.VENUES,   { maxRecords: 500 }),
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.FIELDS,   { maxRecords: 500 })
        ]);

        // Build lookup: record ID or name → Central Assign numeric ID
        refIdLookup = {};
        referees.forEach(r => {
            const caId = r.fields['Central Assign ID'];
            if (caId) {
                refIdLookup[r.id] = parseInt(caId) || caId;
                const name = (r.fields['Name'] || '').toLowerCase();
                if (name) refIdLookup[name] = parseInt(caId) || caId;
            }
        });

        // Build venue lookups — primary: numeric Venue ID; fallback: Supabase record ID
        venueCAId          = {};
        venueNameMap       = {};
        numericVenueToName = {};

        venues.forEach(v => {
            const name    = v.fields['Venue Name'] || v.fields['Name'] || '';
            const numId   = v.fields['Venue ID'] ? (parseInt(v.fields['Venue ID']) || null) : null;
            if (name)  venueNameMap[v.id] = name;            // legacy fallback
            if (numId) venueCAId[v.id]    = numId;           // legacy fallback
            if (numId && name) numericVenueToName[numId] = name; // primary path
        });

        // Build field lookups — primary: numeric Field ID; fallback: Supabase record ID
        fieldNameMap       = {};
        numericFieldToName = {};

        fieldRecs.forEach(f => {
            const fieldId   = f.fields['Field ID'] ? (parseInt(f.fields['Field ID']) || null) : null;
            const fieldName = f.fields['Field Name'] || '';
            const venueNumId = f.fields['Venue ID'] ? (parseInt(f.fields['Venue ID']) || null) : null;
            if (fieldId && fieldName) numericFieldToName[fieldId] = fieldName; // primary path
            if (fieldName) fieldNameMap[f.id] = fieldName;   // legacy fallback
            // Attach venue name and CA ID to field's record ID for legacy lookup
            const venueName = venueNumId ? (numericVenueToName[venueNumId] || '') : '';
            if (venueName)  venueNameMap[f.id] = venueName;
            if (venueNumId) venueCAId[f.id]    = venueNumId;
        });

        progressBar.style.width = '100%';
        progressText.textContent = 'Done!';

        // Club filter — exact match on Source Club field
        const byClub = selectedClubs.length === 0 ? records : records.filter(r => {
            return selectedClubs.some(c => r.fields['Source Club'] === c);
        });

        // Filter to assigned-only if checkbox is checked
        const assignedOnly = document.getElementById('assignedOnly').checked;
        const filtered = assignedOnly
            ? byClub.filter(r => {
                const val = extractRefVal(r.fields['Center Referee']);
                return val && resolveRefCA(val);
              })
            : byClub;

        if (filtered.length === 0) {
            noGamesMsg.textContent = assignedOnly
                ? 'No games with a referee CA ID found. Try unchecking "Assigned games only" — refs may be assigned but missing a Central Assign ID.'
                : 'No games found for the selected filters.';
            noGamesMsg.style.display = 'block';
        } else {
            loadedGames = filtered;
            renderGamesTable(filtered);
            gamesSection.style.display = 'block';
        }

    } catch (err) {
        alert('Failed to load games: ' + err.message);
    } finally {
        loadBtn.disabled = false;
        progressWrap.style.display = 'none';
        progressText.style.display = 'none';
        progressBar.style.width = '0%';
    }
});

// ── Render Games Table ────────────────────────────────────────────────────────
function renderGamesTable(records) {
    gameCount.textContent = `${records.length} game${records.length !== 1 ? 's' : ''} found`;

    let html = `<thead><tr>
        <th><input type="checkbox" id="masterCheck"></th>
        <th>#</th><th>Date</th><th>Time</th>
        <th>Home Team</th><th>Away Team</th>
        <th>Venue</th><th>Age Group</th><th>Center Ref</th>
    </tr></thead><tbody>`;

    records.forEach((rec, i) => {
        const f = rec.fields;
        const { name: venueName, caId: venueId, fieldName } = resolveVenue(f);
        const venueDisplay = venueId
            ? `<span style="color:#27ae60">✓ ${venueName} (ID: ${venueId})</span>`
            : `<span style="color:#e74c3c">⚠ No ID: ${venueName || 'Unknown'}</span>`;

        const crVal     = extractRefVal(f['Center Referee']);
        const crAssigned = !!crVal;
        const crCaId    = crVal ? resolveRefCA(crVal) : null;
        const refDisplay = crCaId
            ? `<span style="color:#27ae60">✓ ID: ${crCaId}</span>`
            : crAssigned
                ? `<span style="color:#e67e22">⚠ Assigned — no CA ID</span>`
                : `<span style="color:#e74c3c">⚠ No ref assigned</span>`;

        html += `<tr>
            <td><input type="checkbox" class="game-check" data-index="${i}" checked></td>
            <td>${i + 1}</td>
            <td>${formatDate(f['Date'] || '')}</td>
            <td>${f['Time'] || ''}</td>
            <td>${f['Home Team'] || ''}</td>
            <td>${f['Away Team'] || ''}</td>
            <td>${venueDisplay}</td>
            <td>${f['Age Group'] || ''}</td>
            <td>${refDisplay}</td>
        </tr>`;
    });

    html += '</tbody>';
    gamesTable.innerHTML = html;

    document.getElementById('masterCheck').addEventListener('change', function() {
        document.querySelectorAll('.game-check').forEach(cb => cb.checked = this.checked);
        checkLimit();
    });

    document.querySelectorAll('.game-check').forEach(cb => {
        cb.addEventListener('change', checkLimit);
    });

    checkLimit();
}

function checkLimit() {
    const selected = document.querySelectorAll('.game-check:checked').length;
    limitWarning.style.display = selected > 100 ? 'block' : 'none';
}

// ── Select / Deselect All ─────────────────────────────────────────────────────
selectAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.game-check').forEach(cb => cb.checked = true);
    checkLimit();
});

deselectAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.game-check').forEach(cb => cb.checked = false);
    checkLimit();
});

// ── Export ────────────────────────────────────────────────────────────────────
exportBtn.addEventListener('click', () => {
    const selected = Array.from(document.querySelectorAll('.game-check:checked'))
        .map(cb => loadedGames[parseInt(cb.dataset.index)])
        .slice(0, 100);

    if (selected.length === 0) {
        alert('Please select at least one game to export.');
        return;
    }

    // Headers matched exactly to CA template
    const headers = [
        'Home Team', 'Visiting Team', 'Duration', 'Duration Time',
        'Game Date', 'Start Time', 'Type (League/Cup/Other)', 'Gender',
        'Venue', 'Venue Field', 'League', 'Referee Id', 'AR1', 'AR2',
        '4th', 'Assessor', 'Diag Sys Ctl', 'Referee Rate', 'AR Rate',
        '4th Rate', 'Assessor Rate', 'External Game Id'
    ];

    const rows = selected.map(rec => {
        const f = rec.fields;
        const { name: venueName, caId: venueId, fieldName } = resolveVenue(f);

        // Resolve Center Referee → Central Assign numeric ID
        const crRaw = extractRefVal(f['Center Referee']);
        let refId = crRaw ? (resolveRefCA(crRaw) || 0) : 0;

        // Map Airtable Gender field to CA format (M/F), fall back to default
        const gameGender = f['Gender'] === 'Male' ? 'M' : f['Gender'] === 'Female' ? 'F' : DEFAULTS.gender;

        // Period length by age group
        const ageGroup = f['Age Group'] || '';
        const { duration, durationTime } = DURATION_BY_AGE[ageGroup] || { duration: '2 x 40', durationTime: 90 };

        return [
            f['Home Team']  || '',
            f['Away Team']  || '',
            duration,
            durationTime,
            formatDateForExport(f['Date'] || ''),
            formatTimeForExport(f['Time'] || ''),
            DEFAULTS.type,
            gameGender,
            venueId || venueName,
            fieldName,
            f['League'] || DEFAULTS.league,
            refId, 0, 0, 0, 0,
            DEFAULTS.diagSysCtl,
            DEFAULTS.refRate,
            DEFAULTS.arRate,
            DEFAULTS.fourthRate,
            DEFAULTS.assessorRate,
            ''  // External Game Id — blank, CA assigns on import
        ].join('\t');
    });

    const content = [headers.join('\t'), ...rows].join('\r\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `central-assign-export-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

// Extract the raw ref identifier from a Center Referee / AR field value.
// Handles: null, integer, name string, actual array, JSON array string "[42]".
function extractRefVal(val) {
    if (!val && val !== 0) return null;
    if (typeof val === 'string' && val.startsWith('[')) {
        try { val = JSON.parse(val); } catch(e) { return val; }
    }
    if (Array.isArray(val)) return val.length > 0 ? val[0] : null;
    return val;
}

// Resolve an extracted ref value → CA numeric ID using refIdLookup.
function resolveRefCA(val) {
    if (val === null || val === undefined) return null;
    return refIdLookup[val] || refIdLookup[(val + '').toLowerCase()] || null;
}

// Resolve venue info from a game's fields object.
// Primary path: use numeric Venue ID / Field ID (set by assignor workstation).
// Fallback: old Airtable linked-record approach.
// Returns { name, caId, fieldName } — caId is the CA venue number.
function resolveVenue(f) {
    const numVenueId = f['Venue ID'] ? (parseInt(f['Venue ID']) || null) : null;
    const numFieldId = f['Field ID'] ? (parseInt(f['Field ID']) || null) : null;

    if (numVenueId) {
        return {
            name:      numericVenueToName[numVenueId] || String(numVenueId),
            caId:      numVenueId,   // Venue ID IS the CA venue ID
            fieldName: numFieldId ? (numericFieldToName[numFieldId] || '') : ''
        };
    }

    // Legacy fallback: old Airtable linked records stored as arrays or JSON strings
    let fieldValue = f['Venue'] || f['Field'];
    if (typeof fieldValue === 'string' && fieldValue.startsWith('[')) {
        try { fieldValue = JSON.parse(fieldValue); } catch(e) {}
    }
    if (!fieldValue) return { name: '', caId: null, fieldName: '' };
    if (Array.isArray(fieldValue) && fieldValue.length > 0) {
        const rid = fieldValue[0];
        return {
            name:      venueNameMap[rid] || '',
            caId:      venueCAId[rid]    || null,
            fieldName: fieldNameMap[rid] || ''
        };
    }
    return { name: String(fieldValue), caId: null, fieldName: '' };
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parseInt(parts[1])}/${parseInt(parts[2])}/${parts[0]}`;
}

function formatDateForExport(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${parseInt(m)}/${parseInt(d)}/${y}`;
}

function formatTimeForExport(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m || 0).padStart(2, '0')} ${period}`;
}
