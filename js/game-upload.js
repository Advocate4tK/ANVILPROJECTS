/**
 * Game Upload Handler
 * Parses a CSV file and uploads each row as a game record to Airtable.
 */

let parsedRows = [];
let clubLeagueMap = {}; // club name (lowercase) → league string

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

    // Load clubs to build Club → League auto-fill map
    progressText.textContent = 'Loading club data...';
    clubLeagueMap = {};
    try {
        const clubs = await airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.CLUBS, { maxRecords: 200 });
        clubs.forEach(c => {
            const name   = (c.fields['Club Name'] || c.fields['Name'] || '').toLowerCase();
            const league = c.fields['League'] || 'Southeast District (21)';
            if (name) clubLeagueMap[name] = league;
        });
    } catch (err) {
        console.warn('Could not load clubs for league auto-fill:', err);
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

    // Fire upload complete notification
    if (successCount > 0) {
        document.dispatchEvent(new CustomEvent('uploadComplete', {
            detail: { gameCount: successCount }
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
        // Try exact match first, then partial match
        const league = clubLeagueMap[clubKey]
            || Object.entries(clubLeagueMap).find(([k]) => k.includes(clubKey) || clubKey.includes(k))?.[1]
            || 'Southeast District (21)';
        fields['League'] = league;
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
