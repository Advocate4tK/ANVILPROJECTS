/**
 * Central Assign Export
 * Pulls games from Airtable and generates a tab-delimited file
 * formatted for Central Assign import.
 */

// ── Venue ID Lookup ────────────────────────────────────────────────────────────
// Maps our venue/field names to Central Assign venue IDs
// Add more as you collect them from Central Assign screenshots
const VENUE_LOOKUP = {
    // Griswold
    'Blackwell Field':              845,
    'Blackwell Field(Canterbury)':  845,
    'Griswold High School':         967,
    'Griswold Soccer Complex':      917,
    'Griswold Town Garage':         510,
    'Manship Park':                 899,
    'Manship Park(Canterbury)':     899,

    // East Haddam
    'Nathan Hale Middle School':    504,
    'Nathan Hale-Ray Middle School': 867
};

// ── Default values for Central Assign fields ──────────────────────────────────
const DEFAULTS = {
    duration:     '2 x 40',
    durationTime: 90,
    type:         'League',
    gender:       'F',
    league:       '',
    diagSysCtl:   1,
    refRate:      40,
    arRate:       25,
    fourthRate:   0,
    assessorRate: 0
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
let refIdLookup = {}; // Airtable record ID → Central Assign numeric ID

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

// ── Load clubs into checkboxes ────────────────────────────────────────────────
async function loadClubCheckboxes() {
    if (!airtableClient) return;
    try {
        const clubs = await airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.CLUBS, { maxRecords: 200 });
        const names = clubs
            .map(c => c.fields['Club Name'] || '')
            .filter(Boolean)
            .sort();
        const wrap = document.getElementById('clubCheckboxes');
        wrap.innerHTML = names.map(n => `
            <label style="display:flex; align-items:center; gap:6px; font-weight:500; cursor:pointer; white-space:nowrap;">
                <input type="checkbox" class="club-cb" value="${n}"> ${n}
            </label>`).join('');
    } catch(e) {
        document.getElementById('clubCheckboxes').innerHTML =
            '<span style="color:#e74c3c; font-size:13px;">Could not load clubs.</span>';
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
        alert('Airtable client not initialized. Check config.js.');
        return;
    }

    const dateFrom     = document.getElementById('dateFrom').value;
    const dateTo       = document.getElementById('dateTo').value;
    const selectedClubs = Array.from(document.querySelectorAll('.club-cb:checked')).map(cb => cb.value);

    loadBtn.disabled = true;
    progressWrap.style.display = 'block';
    progressBar.style.width = '50%';
    progressText.style.display = 'block';
    progressText.textContent = 'Loading games from Airtable...';
    gamesSection.style.display = 'none';
    noGamesMsg.style.display = 'none';

    try {
        // Build date filter — IS_AFTER/IS_BEFORE with ±1 day offset makes both ends inclusive
        const dateParts = [];
        if (dateFrom) dateParts.push(`NOT(IS_BEFORE({Date}, '${dateFrom}'))`);
        if (dateTo)   dateParts.push(`NOT(IS_AFTER({Date}, '${dateTo}'))`);

        // Build club filter — matches home OR away team containing the club name
        let clubFilter = '';
        if (selectedClubs.length > 0) {
            const clubConditions = selectedClubs.map(c =>
                `OR(FIND("${c}", {Home Team}) > 0, FIND("${c}", {Away Team}) > 0)`
            );
            clubFilter = clubConditions.length === 1
                ? clubConditions[0]
                : `OR(${clubConditions.join(', ')})`;
        }

        const allParts = [...dateParts, ...(clubFilter ? [clubFilter] : [])];
        let filter = '';
        if (allParts.length === 1)      filter = allParts[0];
        else if (allParts.length > 1)   filter = `AND(${allParts.join(', ')})`;

        const options = { maxRecords: 500 };
        if (filter) options.filterByFormula = filter;

        // Load referee CA IDs in parallel with games
        progressText.textContent = 'Loading games and referee IDs...';
        const [records, referees] = await Promise.all([
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.GAMES, options),
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.REFEREES, { maxRecords: 1000 })
        ]);

        // Build lookup: Airtable record ID → Central Assign numeric ID
        refIdLookup = {};
        referees.forEach(r => {
            const caId = r.fields['Central Assign ID'];
            if (caId) refIdLookup[r.id] = parseInt(caId) || caId;
        });

        progressBar.style.width = '100%';
        progressText.textContent = 'Done!';

        // Filter to assigned-only if checkbox is checked
        const assignedOnly = document.getElementById('assignedOnly').checked;
        const filtered = assignedOnly
            ? records.filter(r => {
                const cr = r.fields['Center Referee'];
                return Array.isArray(cr) && cr.length > 0 && refIdLookup[cr[0]];
              })
            : records;

        if (filtered.length === 0) {
            noGamesMsg.textContent = assignedOnly
                ? 'No assigned games found for the selected filters. Try unchecking "Assigned games only" to see all games.'
                : 'No games found for the selected date range.';
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
        const venueId = resolveVenueId(f['Field'] || f['Venue'] || '');
        const venueDisplay = venueId
            ? `<span style="color:#27ae60">✓ ID: ${venueId}</span>`
            : `<span style="color:#e74c3c">⚠ No ID: ${f['Field'] || f['Venue'] || 'Unknown'}</span>`;

        const cr = f['Center Referee'];
        const hasRef = Array.isArray(cr) && cr.length > 0 && refIdLookup[cr[0]];
        const refDisplay = hasRef
            ? `<span style="color:#27ae60">✓ ID: ${refIdLookup[cr[0]]}</span>`
            : `<span style="color:#e74c3c">⚠ Unassigned</span>`;

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

    const headers = [
        'Home Team', 'Away Team', 'Duration', 'DurationTime',
        'Date', 'Time', 'Type', 'Gender', 'Venue', 'FieldID',
        'League', 'Referee ID', 'AR1 Id', 'AR2 Id', '4th Id',
        'Assessor Id', 'Diag Sys Ctl', 'Ref Rate', 'AR Rate',
        '4th Rate', 'Assessor Rate'
    ];

    const rows = selected.map(rec => {
        const f = rec.fields;
        const venueId = resolveVenueId(f['Field'] || f['Venue'] || '');

        // Resolve Center Referee → Central Assign numeric ID
        const centerRefField = f['Center Referee'];
        let refId = 0;
        if (Array.isArray(centerRefField) && centerRefField.length > 0) {
            refId = refIdLookup[centerRefField[0]] || 0;
        }

        return [
            f['Home Team']  || '',
            f['Away Team']  || '',
            DEFAULTS.duration,
            DEFAULTS.durationTime,
            formatDateForExport(f['Date'] || ''),
            formatTimeForExport(f['Time'] || ''),
            DEFAULTS.type,
            DEFAULTS.gender,
            venueId || (f['Field'] || f['Venue'] || ''),
            '',
            f['League'] || DEFAULTS.league,
            refId, 0, 0, 0, 0,
            DEFAULTS.diagSysCtl,
            DEFAULTS.refRate,
            DEFAULTS.arRate,
            DEFAULTS.fourthRate,
            DEFAULTS.assessorRate
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
function resolveVenueId(venueName) {
    if (!venueName) return null;
    // Try exact match first
    if (VENUE_LOOKUP[venueName]) return VENUE_LOOKUP[venueName];
    // Try partial match
    for (const key of Object.keys(VENUE_LOOKUP)) {
        if (venueName.toLowerCase().includes(key.toLowerCase()) ||
            key.toLowerCase().includes(venueName.toLowerCase())) {
            return VENUE_LOOKUP[key];
        }
    }
    return null;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('en-US');
}

function formatDateForExport(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
}

function formatTimeForExport(timeStr) {
    if (!timeStr) return '';
    // Convert HH:MM to decimal fraction of day for Excel compatibility
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return timeStr;
    return ((h * 60 + (m || 0)) / 1440).toFixed(10);
}
