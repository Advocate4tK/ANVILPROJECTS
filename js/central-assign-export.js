/**
 * Central Assign Export
 * Pulls games from Airtable and generates a tab-delimited file
 * formatted for Central Assign import.
 */

// VENUE_LOOKUP is no longer hardcoded — CA venue IDs are read directly
// from the Airtable Venues table (Venue ID field) at load time.

// ── Feature gate — Admin + Tod only until general release ────────────────────
(async function checkCAExportAccess() {
    const uid = currentUserId();
    if (!uid) { window.location.href = 'admin.html'; return; }

    // Read email directly from the stored session token — no DB call, no race condition
    const session = _getSupabaseSession();
    const sessionEmail = (session?.user?.email || '').toLowerCase();
    if (sessionEmail === 'nectassignor@gmail.com') return; // Tod — always allowed

    // For everyone else check Admin role — fail open so Admin isn't locked out by a query error
    try {
        const recs  = await supabaseClient.getRecords('Assignors', { maxRecords: 50 });
        const myRec = recs.find(r => r.fields['auth_user_id'] === uid);
        const role  = myRec ? (myRec.fields['Role'] || '').trim() : '';
        if (role !== 'Admin') window.location.href = 'admin.html';
    } catch(e) {
        console.warn('CA Export role check failed:', e.message);
    }
})();

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
let currentSort = { field: 'date', dir: 'asc' };
let refIdLookup        = {}; // Supabase ref ID (int) or lowercase name → CA numeric ID
let venueCAId          = {}; // Supabase record ID → CA venue ID (legacy fallback)
let venueNameMap       = {}; // Supabase record ID → venue name (legacy fallback)
let fieldNameMap       = {}; // Supabase record ID → field name (legacy fallback)
let numericVenueToName = {}; // numeric Venue ID → venue name (primary)
let numericFieldToName = {}; // numeric Field ID → field name (primary)

// ── Export history (localStorage) ────────────────────────────────────────────
const EXPORT_HISTORY_KEY = 'ca_export_history';

function getExportHistory() {
    try { return JSON.parse(localStorage.getItem(EXPORT_HISTORY_KEY) || '{}'); } catch(e) { return {}; }
}

function gameExportKey(f) {
    return `${f['Date']}|${f['Home Team']}|${f['Away Team']}|${f['Time']}`;
}

function getExportedAt(f) {
    return getExportHistory()[gameExportKey(f)] || null;
}

function markAsExported(games) {
    const history = getExportHistory();
    const now = new Date().toISOString();
    games.forEach(rec => { history[gameExportKey(rec.fields)] = now; });
    localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(history));
}

function fmtExportDate(isoStr) {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

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
        const byAssigned = assignedOnly
            ? byClub.filter(r => {
                const val = extractRefVal(r.fields['Center Referee']);
                return val && resolveRefCA(val);
              })
            : byClub;

        // Game type filter
        const gameTypeFilter = document.querySelector('input[name="gameTypeFilter"]:checked')?.value || 'all';
        const filtered = gameTypeFilter === 'all' ? byAssigned : byAssigned.filter(r => {
            const gt = (r.fields['game_type'] || 'Rec');
            return gt === gameTypeFilter;
        });

        if (filtered.length === 0) {
            noGamesMsg.textContent = assignedOnly
                ? 'No games with a referee CA ID found. Try unchecking "Assigned games only" — refs may be assigned but missing a Central Assign ID.'
                : 'No games found for the selected filters.';
            noGamesMsg.style.display = 'block';
        } else {
            loadedGames = filtered;
            applySortAndRender();
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

// ── Sort ──────────────────────────────────────────────────────────────────────
function applySortAndRender() {
    const { field, dir } = currentSort;
    const mult = dir === 'asc' ? 1 : -1;
    loadedGames.sort((a, b) => {
        if (field === 'age') {
            const ageOrder = ['U8','U10','U12','U13','U14','U15','U16','U19'];
            const ai = ageOrder.indexOf(a.fields['Age Group'] || '');
            const bi = ageOrder.indexOf(b.fields['Age Group'] || '');
            return mult * ((ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi));
        }
        // default: date then time
        const d = (a.fields['Date'] || '').localeCompare(b.fields['Date'] || '');
        if (d !== 0) return mult * d;
        return mult * (a.fields['Time'] || '').localeCompare(b.fields['Time'] || '');
    });
    renderGamesTable(loadedGames);
}

function sortBy(field) {
    if (currentSort.field === field) {
        currentSort.dir = currentSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort = { field, dir: 'asc' };
    }
    applySortAndRender();
}

// ── Render Games Table ────────────────────────────────────────────────────────
function refBadge(val) {
    const extracted = extractRefVal(val);
    if (!extracted) return `<span style="color:#c0392b;font-weight:600;" title="No referee assigned">—</span>`;
    const caId = resolveRefCA(extracted);
    return caId
        ? `<span style="color:#1a7a40;font-weight:600;" title="CA ID: ${caId}">✓ ${caId}</span>`
        : `<span style="color:#e67e22;font-weight:600;" title="Assigned but missing CA ID">⚠</span>`;
}

function venueBadge(f) {
    const { name, caId } = resolveVenue(f);
    return caId
        ? `<span style="color:#1a7a40;font-weight:600;" title="CA ID: ${caId}">✓ ${name || caId}</span>`
        : `<span style="color:#c0392b;font-weight:600;" title="${name || 'Unknown'}">⚠ ${name || 'No Venue ID'}</span>`;
}

function fmtTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h)) return t;
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function renderGamesTable(records) {
    // Summary counts
    let venueOk = 0, refOk = 0;
    records.forEach(rec => {
        const f = rec.fields;
        if (resolveVenue(f).caId) venueOk++;
        const cr = extractRefVal(f['Center Referee']);
        if (cr && resolveRefCA(cr)) refOk++;
    });
    const total = records.length;
    gameCount.innerHTML = `
        <span style="font-weight:700;">${total} game${total !== 1 ? 's' : ''}</span>
        &nbsp;|&nbsp;
        <span style="color:${venueOk===total?'#27ae60':'#e67e22'}">Venues: ${venueOk}/${total} ✓</span>
        &nbsp;|&nbsp;
        <span style="color:${refOk===total?'#27ae60':'#e67e22'}">Refs: ${refOk}/${total} ✓</span>`;

    const sortHdr = (field, label, width) => {
        const active = currentSort.field === field;
        const icon   = active ? (currentSort.dir === 'asc' ? ' ▲' : ' ▼') : ' ⇅';
        const color  = active ? '#0f3460' : '#888';
        return `<th onclick="sortBy('${field}')" style="cursor:pointer;user-select:none;color:${color};white-space:nowrap;width:${width};">${label}<span style="font-size:0.7em;">${icon}</span></th>`;
    };

    let html = `<thead><tr style="font-size:0.78rem;">
        <th style="width:24px;"><input type="checkbox" id="masterCheck"></th>
        <th style="width:24px;">#</th>
        ${sortHdr('date','Date','85px')}
        <th style="width:65px;">Time</th>
        <th style="width:20%;">Home</th>
        <th style="width:20%;">Away</th>
        ${sortHdr('age','Age','44px')}
        <th style="width:18%;">Venue</th>
        <th style="width:52px;">CR</th>
        <th style="width:52px;">AR1</th>
        <th style="width:52px;">AR2</th>
        <th style="width:80px;" title="Previously exported to CA">Prior</th>
    </tr></thead><tbody>`;

    records.forEach((rec, i) => {
        const f = rec.fields;
        const exportedAt = getExportedAt(f);
        const priorBadge = exportedAt
            ? `<span style="color:#e67e22;font-size:11px;white-space:nowrap;font-weight:600;" title="Exported ${fmtExportDate(exportedAt)}">⚠ ${fmtExportDate(exportedAt)}</span>`
            : `<span style="color:#aaa;font-size:11px;">—</span>`;
        const rowBg = exportedAt
            ? 'background:rgba(230,126,34,0.08);'
            : (i % 2 === 0 ? 'background:rgba(15,52,96,0.28);' : '');
        html += `<tr style="font-size:0.78rem;${rowBg}">
            <td style="padding:5px 4px;"><input type="checkbox" class="game-check" data-index="${i}" checked></td>
            <td style="color:#999;padding:5px 4px;">${i + 1}</td>
            <td style="white-space:nowrap;">${formatDate(f['Date'] || '')}</td>
            <td style="white-space:nowrap;">${fmtTime(f['Time'] || '')}</td>
            <td style="word-break:break-word;">${f['Home Team'] || ''}</td>
            <td style="word-break:break-word;">${f['Away Team'] || ''}</td>
            <td style="text-align:center;">${f['Age Group'] || ''}</td>
            <td>${venueBadge(f)}</td>
            <td>${refBadge(f['Center Referee'])}</td>
            <td>${refBadge(f['AR 1'])}</td>
            <td>${refBadge(f['AR 2'])}</td>
            <td>${priorBadge}</td>
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

    const gamesOnly = document.getElementById('gamesOnly').checked;

    // Duplicate check — warn before allowing re-export
    const priorExports = selected.filter(rec => getExportedAt(rec.fields));
    if (priorExports.length > 0) {
        const lines = priorExports.map(rec => {
            const f = rec.fields;
            return `  • ${formatDate(f['Date'])} ${fmtTime(f['Time'])} — ${f['Home Team']} vs ${f['Away Team']}\n    (exported ${fmtExportDate(getExportedAt(f))})`;
        }).join('\n');
        const proceed = confirm(
            `⚠️ ${priorExports.length} game${priorExports.length > 1 ? 's' : ''} in this selection ${priorExports.length > 1 ? 'were' : 'was'} already exported:\n\n${lines}\n\nExporting again may create duplicates in Central Assign. Continue anyway?`
        );
        if (!proceed) return;
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

        // Resolve refs — blank everything if gamesOnly is checked
        let refId = 0, ar1Id = 0, ar2Id = 0;
        if (!gamesOnly) {
            const crRaw  = extractRefVal(f['Center Referee']);
            const ar1Raw = extractRefVal(f['AR 1']);
            const ar2Raw = extractRefVal(f['AR 2']);
            refId = crRaw  ? (resolveRefCA(crRaw)  || 0) : 0;
            ar1Id = ar1Raw ? (resolveRefCA(ar1Raw) || 0) : 0;
            ar2Id = ar2Raw ? (resolveRefCA(ar2Raw) || 0) : 0;
        }

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
            refId, ar1Id, ar2Id, 0, 0,
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

    // Mark all exported games with timestamp, then refresh table badges
    markAsExported(selected);
    renderGamesTable(loadedGames);
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
    // Normalize: unwrap array or use raw integer/string ID directly
    const rid = Array.isArray(fieldValue) ? fieldValue[0] : fieldValue;
    return {
        name:      venueNameMap[rid] || String(rid),
        caId:      venueCAId[rid]    || null,
        fieldName: fieldNameMap[rid] || ''
    };
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
