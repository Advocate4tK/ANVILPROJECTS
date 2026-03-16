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
const loadBtn       = document.getElementById('loadBtn');
const exportBtn     = document.getElementById('exportBtn');
const selectAllBtn  = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const gamesSection  = document.getElementById('gamesSection');
const gamesTable    = document.getElementById('gamesTable');
const gameCount     = document.getElementById('gameCount');
const noGamesMsg    = document.getElementById('noGamesMsg');
const limitWarning  = document.getElementById('limitWarning');
const progressWrap  = document.getElementById('progressWrap');
const progressBar   = document.getElementById('progressBar');
const progressText  = document.getElementById('progressText');

let loadedGames = [];
let refIdLookup = {}; // Airtable record ID → Central Assign numeric ID

// ── Load Games ────────────────────────────────────────────────────────────────
loadBtn.addEventListener('click', async () => {
    if (!airtableClient) {
        alert('Airtable client not initialized. Check config.js.');
        return;
    }

    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo   = document.getElementById('dateTo').value;

    loadBtn.disabled = true;
    progressWrap.style.display = 'block';
    progressBar.style.width = '50%';
    progressText.style.display = 'block';
    progressText.textContent = 'Loading games from Airtable...';
    gamesSection.style.display = 'none';
    noGamesMsg.style.display = 'none';

    try {
        let filter = '';
        if (dateFrom && dateTo) {
            filter = `AND(IS_AFTER({Date}, '${dateFrom}'), IS_BEFORE({Date}, '${dateTo}'))`;
        } else if (dateFrom) {
            filter = `IS_AFTER({Date}, '${dateFrom}')`;
        } else if (dateTo) {
            filter = `IS_BEFORE({Date}, '${dateTo}')`;
        }

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

        if (records.length === 0) {
            noGamesMsg.style.display = 'block';
        } else {
            loadedGames = records;
            renderGamesTable(records);
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
        <th>Venue</th><th>Age Group</th>
    </tr></thead><tbody>`;

    records.forEach((rec, i) => {
        const f = rec.fields;
        const venueId = resolveVenueId(f['Field'] || f['Venue'] || '');
        const venueDisplay = venueId
            ? `<span style="color:#27ae60">✓ ID: ${venueId}</span>`
            : `<span style="color:#e74c3c">⚠ No ID: ${f['Field'] || f['Venue'] || 'Unknown'}</span>`;

        html += `<tr>
            <td><input type="checkbox" class="game-check" data-index="${i}" checked></td>
            <td>${i + 1}</td>
            <td>${formatDate(f['Date'] || '')}</td>
            <td>${f['Time'] || ''}</td>
            <td>${f['Home Team'] || ''}</td>
            <td>${f['Away Team'] || ''}</td>
            <td>${venueDisplay}</td>
            <td>${f['Age Group'] || ''}</td>
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
