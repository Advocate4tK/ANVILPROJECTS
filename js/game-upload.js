/**
 * Game Upload Handler
 * Parses a CSV file and uploads each row as a game record to Airtable.
 */

let parsedRows = [];
let clubLeagueMap  = {}; // club name (lowercase) → league number
let clubEmailMap   = {}; // club name (lowercase) → president email
let clubNameMap    = {}; // club name (lowercase) → display name
let fieldLookup    = {}; // "venuename|fieldname" (lowercase) → Airtable Field record ID
let uploadedByClub = {}; // club display name → array of game summary strings

// ── CSV field name → Airtable field name mapping ──────────────────────────────
const FIELD_MAP = {
    'Date':           'Date',
    'Time':           'Time',
    'Home Team':      'Home Team',
    'Away Team':      'Away Team',
    'Age Group':      'Age Group',
    'Gender':         'Gender',
    'League':         'League',
    'Division':       'Division',
    'Game Status':    'Game Status',
    'Notes':          'Notes'
};
// Note: 'Club' column auto-fills League. 'Field' is a linked record and must be linked manually.

// ── DOM refs ──────────────────────────────────────────────────────────────────
const dropZone      = document.getElementById('dropZone');
const fileInput     = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewTable  = document.getElementById('previewTable');
const previewCount  = document.getElementById('previewCount');
const previewTitle  = document.getElementById('previewTitle');
const uploadBtn     = document.getElementById('uploadBtn');
const clearBtn      = document.getElementById('clearBtn');
const progressWrap  = document.getElementById('progressWrap');
const progressBar   = document.getElementById('progressBar');
const progressText  = document.getElementById('progressText');
const resultsSection = document.getElementById('resultsSection');
const summaryBox    = document.getElementById('summaryBox');
const resultsList   = document.getElementById('resultsList');

// ── Drag & drop ───────────────────────────────────────────────────────────────
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
});

fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) handleFile(fileInput.files[0]);
});

clearBtn.addEventListener('click', resetPage);

// ── File handling ─────────────────────────────────────────────────────────────
function handleFile(file) {
    if (!file.name.endsWith('.csv')) {
        alert('Please select a .csv file.');
        return;
    }
    const reader = new FileReader();
    reader.onload = e => {
        const { headers, rows } = parseCSV(e.target.result);
        if (rows.length === 0) {
            alert('No data rows found in the CSV.');
            return;
        }
        parsedRows = rows;
        showPreview(headers, rows);
    };
    reader.readAsText(file);
}

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const headers = parseCSVLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = parseCSVLine(lines[i]);
        const row = {};
        headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || '').trim(); });
        rows.push(row);
    }
    return { headers: headers.map(h => h.trim()), rows };
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += line[i];
        }
    }
    result.push(current);
    return result;
}

// ── Preview ───────────────────────────────────────────────────────────────────
function showPreview(headers, rows) {
    previewTitle.textContent = 'Preview — ' + rows.length + ' game' + (rows.length !== 1 ? 's' : '') + ' ready to upload';
    previewCount.textContent = 'Review the data below, then click Upload to Airtable.';

    let html = '<thead><tr><th>#</th>';
    headers.forEach(h => { html += `<th>${h}</th>`; });
    html += '</tr></thead><tbody>';

    rows.forEach((row, i) => {
        html += `<tr id="row-${i}"><td>${i + 1}</td>`;
        headers.forEach(h => { html += `<td>${row[h] || ''}</td>`; });
        html += '</tr>';
    });
    html += '</tbody>';

    previewTable.innerHTML = html;
    previewSection.style.display = 'block';
    resultsSection.style.display = 'none';
}

// ── Upload ────────────────────────────────────────────────────────────────────
uploadBtn.addEventListener('click', async () => {
    if (!airtableClient) {
        alert('Airtable client not initialized. Check config.js.');
        return;
    }
    if (parsedRows.length === 0) return;

    uploadBtn.disabled = true;
    clearBtn.disabled = true;
    progressWrap.style.display = 'block';
    progressText.style.display = 'block';
    resultsSection.style.display = 'none';
    resultsList.innerHTML = '';

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;
    const total = parsedRows.length;
    uploadedByClub = {};

    // Load clubs and fields in parallel for auto-fill lookups
    progressText.textContent = 'Loading club and field data...';
    clubLeagueMap = {};
    fieldLookup   = {};
    try {
        const [clubs, venues, fieldRecs] = await Promise.all([
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.CLUBS,  { maxRecords: 200 }),
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.VENUES, { maxRecords: 500 }),
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.FIELDS, { maxRecords: 500 })
        ]);

        // Club name → league number, email, display name
        clubs.forEach(c => {
            const display = c.fields['Club Name'] || c.fields['Name'] || '';
            const name    = display.toLowerCase();
            const league  = c.fields['League'] || 21;
            const email   = c.fields['President Email'] || c.fields['Email'] || c.fields['Contact Email'] || '';
            if (name) {
                clubLeagueMap[name] = league;
                clubEmailMap[name]  = email;
                clubNameMap[name]   = display;
            }
        });

        // Venue record ID → venue name
        const venueNames = {};
        venues.forEach(v => {
            venueNames[v.id] = (v.fields['Venue Name'] || '').toLowerCase();
        });

        // "venuename|fieldname" → Field record ID
        fieldRecs.forEach(f => {
            const fieldName  = (f.fields['Field Name'] || '').toLowerCase();
            const linkedVenue = f.fields['Venue'];
            const venueName  = (Array.isArray(linkedVenue) && linkedVenue.length > 0)
                ? (venueNames[linkedVenue[0]] || '')
                : '';
            if (fieldName) {
                // Index by venue+field and by field alone (fallback)
                if (venueName) fieldLookup[`${venueName}|${fieldName}`] = f.id;
                fieldLookup[`|${fieldName}`] = f.id; // field-only fallback
            }
        });
    } catch (err) {
        console.warn('Could not load lookup data:', err);
    }

    // Fetch existing games to detect duplicates
    progressText.textContent = 'Checking for existing games...';
    let existingKeys = new Set();
    try {
        const existing = await airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.GAMES, { maxRecords: 1000 });
        existing.forEach(record => {
            const key = duplicateKey(
                record.fields['Date'] || '',
                record.fields['Home Team'] || '',
                record.fields['Away Team'] || ''
            );
            existingKeys.add(key);
        });
    } catch (err) {
        console.warn('Could not fetch existing games for duplicate check:', err);
    }

    for (let i = 0; i < total; i++) {
        const row = parsedRows[i];
        const rowEl = document.getElementById(`row-${i}`);
        const label = `"${row['Home Team'] || '?'} vs ${row['Away Team'] || '?'}"`;

        progressText.textContent = `Uploading ${i + 1} of ${total}...`;
        progressBar.style.width = Math.round((i / total) * 100) + '%';

        // Duplicate check
        const key = duplicateKey(row['Date'] || '', row['Home Team'] || '', row['Away Team'] || '');
        if (existingKeys.has(key)) {
            skipCount++;
            if (rowEl) rowEl.classList.add('row-skipped');
            addResult('skipped', `Row ${i + 1}: ${label} skipped — already exists in Airtable.`);
            continue;
        }

        try {
            const fields = buildFields(row);
            await airtableClient.createRecord(CONFIG.AIRTABLE_TABLES.GAMES, fields);
            existingKeys.add(key); // prevent re-upload within same batch
            successCount++;
            if (rowEl) rowEl.classList.add('row-success');
            addResult('success', `Row ${i + 1}: ${label} uploaded successfully.`);
            // Track for confirmation email
            const clubKey     = (row['Club'] || row['Home Team'] || '').trim().toLowerCase();
            const clubDisplay = clubNameMap[clubKey] || Object.entries(clubNameMap).find(([k]) => clubKey.includes(k) || k.includes(clubKey))?.[1] || (row['Club'] || row['Home Team'] || 'Unknown');
            if (!uploadedByClub[clubDisplay]) uploadedByClub[clubDisplay] = [];
            uploadedByClub[clubDisplay].push(`${row['Date'] || ''} ${row['Time'] || ''} — ${row['Home Team'] || ''} vs ${row['Away Team'] || ''} (${row['Age Group'] || row['Age'] || ''})`);

        } catch (err) {
            errorCount++;
            if (rowEl) rowEl.classList.add('row-error');
            addResult('error', `Row ${i + 1}: ${label} failed — ${err.message}`);
        }
    }

    progressBar.style.width = '100%';
    progressText.textContent = 'Done!';

    // Summary
    resultsSection.style.display = 'block';
    const parts = [];
    if (successCount) parts.push(`${successCount} uploaded`);
    if (skipCount) parts.push(`${skipCount} skipped (duplicates)`);
    if (errorCount) parts.push(`${errorCount} failed`);

    if (errorCount === 0 && skipCount === 0) {
        summaryBox.className = 'summary-box all-good';
    } else if (errorCount === 0) {
        summaryBox.className = 'summary-box all-good';
    } else {
        summaryBox.className = 'summary-box some-errors';
    }
    summaryBox.textContent = parts.join(', ') + '.';

    uploadBtn.disabled = false;
    clearBtn.disabled = false;
    summaryBox.scrollIntoView({ behavior: 'smooth' });

    // Fire upload complete notification — includes per-club game lists and emails
    if (successCount > 0) {
        document.dispatchEvent(new CustomEvent('uploadComplete', {
            detail: { gameCount: successCount, uploadedByClub, clubEmailMap, clubNameMap }
        }));
    }
});

// ── Build Airtable fields from a CSV row ──────────────────────────────────────
function buildFields(row) {
    const fields = {};
    Object.entries(FIELD_MAP).forEach(([csvCol, airtableField]) => {
        const value = row[csvCol];
        if (value && value !== '') {
            fields[airtableField] = value;
        }
    });

    // Auto-fill League from Club column if League is blank
    if (!fields['League'] && row['Club'] && row['Club'].trim() !== '') {
        const clubKey = row['Club'].trim().toLowerCase();
        const league = clubLeagueMap[clubKey]
            || Object.entries(clubLeagueMap).find(([k]) => k.includes(clubKey) || clubKey.includes(k))?.[1]
            || 21;
        fields['League'] = league;
    }

    // Resolve Field linked record from Venue + Field columns
    const venueCol = (row['Venue'] || '').trim().toLowerCase();
    const fieldCol = (row['Field'] || '').trim().toLowerCase();
    if (fieldCol) {
        const fieldId = fieldLookup[`${venueCol}|${fieldCol}`] || fieldLookup[`|${fieldCol}`];
        if (fieldId) fields['Field'] = [fieldId];
    }

    return fields;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function duplicateKey(date, homeTeam, awayTeam) {
    return `${date}|${homeTeam.trim().toLowerCase()}|${awayTeam.trim().toLowerCase()}`;
}

function addResult(type, message) {
    const div = document.createElement('div');
    div.className = `result-item ${type}`;
    const icon = type === 'success' ? '✅' : type === 'skipped' ? '⏭️' : '❌';
    div.textContent = `${icon} ${message}`;
    resultsList.appendChild(div);
}

function resetPage() {
    parsedRows = [];
    previewSection.style.display = 'none';
    resultsSection.style.display = 'none';
    progressWrap.style.display = 'none';
    progressText.style.display = 'none';
    progressBar.style.width = '0%';
    previewTable.innerHTML = '';
    resultsList.innerHTML = '';
    fileInput.value = '';
}
