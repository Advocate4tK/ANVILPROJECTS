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
// NOTE: there is deliberately no `league` default. Central Assign's importer
// matches the League column by NAME; a wrong-but-valid name lands the games in
// another assignor's district and disappears silently (that is what happened to
// East Haddam under league 518 — Ron Packard had to move them by hand). A game
// with no resolvable league is now refused at export instead.
const DEFAULTS = {
    type:         'League',
    refRate:      40,
    arRate:       25,
    fourthRate:   0,
    externalSys:  'Referee Tool'
};

// ── Central Assign league names — these strings must match CA exactly ─────────
// The old importer took numeric league IDs; the CSV importer takes the name.
// Legacy ca_league_id values are translated here. Anything not in this map has
// to be set as text on the club (clubs.ca_league) before its games can export.
const CA_LEAGUE_NAMES = {
    19: 'CT Northeast District Travel League'
};

// The leagues Central Assign accepts — read off CA's own League dropdown and sent by
// Eric 2026-08-29. This list was previously recorded as 9 and was short by five: the
// three EDP leagues, Stonington Tournament and USL Youth were all missing.
// Use CA_LEAGUES below rather than retyping these anywhere.
const CA_LEAGUES = [
    'CJSA Connecticut Cup',
    'CJSA State Cup',
    'CJSA State League',
    'CT Central/North Central District Travel League',
    'CT Northeast District Travel League',
    'CT Northwest District Travel League',
    'CT Southcentral District Travel League',
    'CT Southeast District Travel League',
    'EDP Academy Zone I',
    'EDP Championship League',
    'EDP Futures',
    'General Non-League Games',   // the per-game escape hatch — any club can use it
    'Stonington Tournament',
    'USL Youth'
];
// ⚠️ A club can belong to MORE THAN ONE of these (Tod, 2026-08-29), so a single
// clubs.ca_league cannot represent reality — the club needs a LIST, and each game
// picks one from its club's list (or General Non-League Games).
// Per Eric's signature, the EDP clubs are: NEU, CT-Rush East, Vale.

// clubs.ca_league is TEXT holding a JSON array, written by Entity Status in
// manage-clubs.html. Tolerates a bare string from before that existed, and an empty
// value — a club with no league set exports a BLANK League column, which is what
// every game did until 2026-08-29.
// ⚠️ Mirror of parseClubLeagues() in manage-clubs.html.
function parseClubLeagues(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    const s = String(v).trim();
    if (s.startsWith('[')) { try { return JSON.parse(s); } catch (e) { return []; } }
    return [s];
}

// ── Period lengths by age group (REC) ─────────────────────────────────────────
// durationTime = (2 × period) + halftime  (U8–U12 = 5 min HT, U13+ = 10 min HT)
// Comp game durations TBD — handle separately when built
const DURATION_BY_AGE = {
    'U8':  { duration: '2 x 20', durationTime: 45  },  // 40 + 5
    'U9':  { duration: '2 x 20', durationTime: 45  },  // 40 + 5
    'U10': { duration: '2 x 20', durationTime: 45  },  // 40 + 5
    'U11': { duration: '2 x 35', durationTime: 75  },  // 70 + 5
    'U12': { duration: '2 x 35', durationTime: 75  },  // 70 + 5
    'U13': { duration: '2 x 40', durationTime: 90  },  // 80 + 10
    'U14': { duration: '2 x 40', durationTime: 90  },  // 80 + 10
    'U15': { duration: '2 x 40', durationTime: 90  },  // 80 + 10
    'U16': { duration: '2 x 40', durationTime: 90  },  // 80 + 10
    'U17': { duration: '2 x 40', durationTime: 90  },  // 80 + 10
    'U18': { duration: '2 x 40', durationTime: 90  },  // 80 + 10
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
let tournamentNames    = new Set(); // populated by loadClubCheckboxes; used by loadBtn to route to tournament_games
let refIdLookup        = {}; // Supabase ref ID (int) or lowercase name → CA numeric ID
let venueCAId          = {}; // Supabase record ID → CA venue ID (legacy fallback)
let venueNameMap       = {}; // Supabase record ID → venue name (legacy fallback)
let fieldNameMap       = {}; // Supabase record ID → field name (legacy fallback)
let numericVenueToName = {}; // numeric Venue ID → venue name (primary)
let numericFieldToName = {}; // numeric Field ID → field name (primary)
let clubLeagueMap      = {}; // club name → CA league ID (legacy numeric)
let clubLeagueNameMap  = {}; // club name → CA league NAME (clubs.ca_league) — primary
let clubIdMap          = {}; // club name → clubs.id (int PK)
let payRateByClubId    = {}; // club_id → ageBand → {center, ar}
let eventLeagueMap     = {}; // event Club Name → CA league ID (from event age_groups)
let eventDurationMap   = {}; // event Club Name → ageKey → {duration, durationTime}
let eventCrewMap       = {}; // event Club Name → ageKey → crew size (1/2/3)
let eventRateMap       = {}; // event Club Name → ageKey → {center, ar}
let assignorsByClub    = {}; // club name → [{name, email}] — CA needs an assignor per game
let myAssignorEmail    = '';  // whoever is doing the export, when they assign the club

// ── Age group → pay_rates band ───────────────────────────────────────────────
function ageBand(ageGroup) {
    const ag = (ageGroup || '').replace(/\s/g, '').toUpperCase();
    if (ag === 'U8')  return 'U8';
    if (['U9','U10'].includes(ag))        return 'U9-U10';
    if (['U11','U12'].includes(ag))       return 'U11-U12';
    if (['U13','U14','U15'].includes(ag)) return 'U13-U15';
    if (['U16','U17','U18','U19'].includes(ag)) return 'U18-U19';
    return null;
}

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

// ⚠️ The localStorage history is kept, but it is no longer the source of truth.
// It was keyed Date|Home Team|Away Team|Time, so correcting a team name or
// moving a kickoff quietly un-exported the game; it never left this browser, so
// the workstation could not see it and Eric's exports were invisible to Tod.
// `ca_exported_at` on the row is what the badges read. The local copy stays
// only so this page's own "exported at" column keeps working offline.
// ⚠️ Exporting is NOT uploading. This stamps ca_exported_at only — the AMBER
// state. Nothing turns green until Tod confirms Central Assign actually took the
// file (confirmCAImport below). On 2026-09-03 a file exported perfectly and CA
// rejected every row; an export-only flag would have shown four green games that
// were nowhere.
async function markAsExported(games) {
    const history = getExportHistory();
    const now = new Date().toISOString();
    games.forEach(rec => { history[gameExportKey(rec.fields)] = now; });
    localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(history));

    // Write the stamp per table. A failure here must not lose the download the
    // user just got, so it warns rather than throws.
    const byTable = {};
    games.forEach(rec => {
        const t = rec._table || 'games';
        const id = parseInt(rec.id, 10);
        if (!Number.isFinite(id)) return;
        (byTable[t] = byTable[t] || []).push(id);
    });
    // One batch id per export file, so the whole upload is confirmed with a
    // single click instead of game by game.
    const batch = 'x' + Date.now().toString(36);
    for (const [table, ids] of Object.entries(byTable)) {
        try {
            const { error } = await supabaseClient.client
                .from(table).update({ ca_exported_at: now, ca_export_batch: batch }).in('id', ids);
            if (error) throw new Error(error.message);
        } catch (e) {
            console.warn(`could not stamp ca_exported_at on ${table}`, e);
        }
    }
    return { batch, count: Object.values(byTable).reduce((a, b) => a + b.length, 0), tables: Object.keys(byTable) };
}

// ── Confirming the upload ────────────────────────────────────────────────────
// The step that makes a game green. Deliberately manual: only Central Assign
// knows whether it took the file, and only Tod can read what it said.
let _lastExportBatch = null;

// The three honest answers to "did Central Assign take these?" are yes, no and
// SOME. Partial imports are the normal case, not the exception: on 2026-09-05 a
// seven-game file came back 4 imported / 3 errors because CA calls two of the
// fields "Field #3" and "Field #4" while our records called them 3 and 4. An
// all-or-nothing confirm would have marked three rejected games green.
function showCAConfirmBar(res, records) {
    const host = document.getElementById('caConfirmBar');
    if (!host || !res || !res.count) return;
    _lastExportBatch = { ...res, records: records || [] };
    host.style.display = 'block';
    host.innerHTML = `<div style="background:#7d5a00;border:1px solid #e67e22;border-radius:10px;padding:12px 18px;
        display:flex;align-items:center;gap:12px;flex-wrap:wrap;color:#fff;">
        <span style="font-size:0.78rem;font-weight:900;letter-spacing:1.3px;color:#ffd479;">\u26a0 AWAITING CONFIRMATION</span>
        <span style="font-size:0.9rem;flex:1;min-width:220px;">
            ${res.count} game${res.count === 1 ? '' : 's'} exported. Upload the file to Central Assign \u2014 what did it say?
        </span>
        <button onclick="caConfirmYes()" style="background:#1e8449;color:#fff;border:none;border-radius:6px;
            padding:6px 14px;font-weight:800;font-size:0.8rem;cursor:pointer;">\u2713 All imported</button>
        <button onclick="caConfirmSomePrompt()" style="background:#e67e22;color:#fff;border:none;border-radius:6px;
            padding:6px 14px;font-weight:800;font-size:0.8rem;cursor:pointer;">Some imported\u2026</button>
        <button onclick="caConfirmDismiss()" style="background:none;color:#ffd479;border:1px solid #e67e22;
            border-radius:6px;padding:6px 12px;font-weight:700;font-size:0.8rem;cursor:pointer;">None / not yet</button>
    </div>
    <div id="caConfirmPicker" style="display:none;"></div>`;
}

// Rows are listed in FILE ORDER and numbered, because that is how CA reports
// results back \u2014 "Row 2: Field '4' not found". Matching the numbering means
// reading CA's error list and unticking the same numbers here, with no counting.
function caConfirmSomePrompt() {
    const box = document.getElementById('caConfirmPicker');
    const b = _lastExportBatch;
    if (!box || !b) return;
    const rows = b.records.map((rec, i) => {
        const f = rec.fields;
        return `<label style="display:flex;align-items:center;gap:8px;padding:3px 0;font-size:0.82rem;cursor:pointer;">
            <input type="checkbox" class="ca-imp-cb" data-idx="${i}" checked>
            <span style="color:#888;min-width:28px;">${i + 1}</span>
            <span>${formatDate(f['Date'])} ${fmtTime(f['Time'])} \u2014 ${f['Home Team'] || '?'} vs ${f['Away Team'] || '?'}</span>
        </label>`;
    }).join('');
    box.style.display = 'block';
    box.innerHTML = `<div style="background:#12233f;border:1px solid #e67e22;border-top:none;
        border-radius:0 0 10px 10px;padding:12px 18px;color:#fff;">
        <div style="font-size:0.82rem;color:#ffd479;font-weight:700;margin-bottom:8px;">
            Untick the rows Central Assign rejected. Row numbers match CA's results list.
        </div>
        <div style="max-height:260px;overflow:auto;">${rows}</div>
        <div style="margin-top:10px;display:flex;gap:10px;align-items:center;">
            <button onclick="caConfirmSome()" style="background:#1e8449;color:#fff;border:none;border-radius:6px;
                padding:6px 14px;font-weight:800;font-size:0.8rem;cursor:pointer;">Confirm ticked rows</button>
            <span style="font-size:0.75rem;color:#9fb0c8;">Unticked games stay outstanding \u2014 fix them and export again.</span>
        </div>
    </div>`;
}

async function stampImported(recs) {
    const now = new Date().toISOString();
    const byTable = {};
    recs.forEach(rec => {
        const t = rec._table || 'games';
        const id = parseInt(rec.id, 10);
        if (Number.isFinite(id)) (byTable[t] = byTable[t] || []).push(id);
    });
    for (const [table, ids] of Object.entries(byTable)) {
        const { error } = await supabaseClient.client
            .from(table).update({ ca_imported_at: now }).in('id', ids);
        if (error) throw new Error(error.message);
    }
}

function caConfirmDone(n) {
    const host = document.getElementById('caConfirmBar');
    if (host) host.innerHTML = `<div style="background:#1e8449;border-radius:10px;padding:12px 18px;color:#fff;font-weight:700;">
        \u2713 ${n} game${n === 1 ? '' : 's'} confirmed in Central Assign.</div>`;
    _lastExportBatch = null;
    if (typeof loadedGames !== 'undefined') renderGamesTable(loadedGames);
    if (typeof loadClubPendingCounts === 'function') loadClubPendingCounts();
}

// Confirms a whole export file by its batch id. Kept separate from
// stampImported(): this covers every row that carries the batch, so it is right
// even if the in-memory record list has been re-rendered underneath us.
async function confirmCAImport(batch, tables) {
    const now = new Date().toISOString();
    for (const table of (tables && tables.length ? tables : ['games'])) {
        const { error } = await supabaseClient.client
            .from(table).update({ ca_imported_at: now }).eq('ca_export_batch', batch);
        if (error) throw new Error(error.message);
    }
}

// ⚠️ The confirm BAR only exists in the moment after an export. Tod leaves the
// page to upload the file and read CA's result, and by the time he knows the
// answer the bar is gone — which is how confirming ended up being done in SQL by
// hand. This is the same action, available at any time, on the row itself.
//
// It also covers the cases CA does not call "Duplicate". A field conflict against
// our OWN fixture means CA already holds the game (#404236, RHAM vs Colchester,
// 2026-09-05) — no amount of re-exporting will fix that, and the honest record is
// simply that CA has it.
async function setGameCA(rec, inCA) {
    const table = rec._table || 'games';
    const id = parseInt(rec.id, 10);
    if (!Number.isFinite(id)) return;
    const val = inCA ? new Date().toISOString() : null;
    const { error } = await supabaseClient.client
        .from(table).update({ ca_imported_at: val }).eq('id', id);
    if (error) throw new Error(error.message);
    rec.fields['ca_imported_at'] = val;
}

async function toggleGameCA(idx, event) {
    if (event) event.stopPropagation();
    const rec = loadedGames[idx];
    if (!rec) return;
    const now = !!rec.fields['ca_imported_at'];
    try {
        await setGameCA(rec, !now);
        renderGamesTable(loadedGames);
        if (typeof loadClubPendingCounts === 'function') loadClubPendingCounts();
    } catch (e) {
        alert('Could not update: ' + e.message);
    }
}

// Bulk version for the checked rows — the usual case is "CA took most of that
// file", and ticking them one at a time invites the wrong kind of patience.
async function markCheckedInCA(inCA) {
    const recs = [...document.querySelectorAll('.game-check:checked')]
        .map(cb => loadedGames[parseInt(cb.dataset.index, 10)])
        .filter(Boolean);
    if (!recs.length) { alert('No games checked.'); return; }
    const verb = inCA ? 'Mark' : 'Un-mark';
    if (!confirm(`${verb} ${recs.length} checked game${recs.length === 1 ? '' : 's'} as in Central Assign?`)) return;
    try {
        for (const rec of recs) await setGameCA(rec, inCA);
        renderGamesTable(loadedGames);
        if (typeof loadClubPendingCounts === 'function') loadClubPendingCounts();
    } catch (e) {
        alert('Could not update: ' + e.message);
    }
}

async function caConfirmYes() {
    if (!_lastExportBatch) return;
    try {
        await confirmCAImport(_lastExportBatch.batch, _lastExportBatch.tables);
        caConfirmDone(_lastExportBatch.count);
    } catch (e) {
        alert('Could not save the confirmation: ' + e.message);
    }
}

async function caConfirmSome() {
    const b = _lastExportBatch;
    if (!b) return;
    const picked = [...document.querySelectorAll('.ca-imp-cb:checked')]
        .map(cb => b.records[parseInt(cb.dataset.idx, 10)])
        .filter(Boolean);
    if (!picked.length) { caConfirmDismiss(); return; }
    try {
        await stampImported(picked);
        caConfirmDone(picked.length);
    } catch (e) {
        alert('Could not save the confirmation: ' + e.message);
    }
}

// "None / not yet" hides the bar but changes NOTHING. The games stay amber and
// keep counting as outstanding, which is the honest answer until CA has spoken.
function caConfirmDismiss() {
    const host = document.getElementById('caConfirmBar');
    if (host) host.style.display = 'none';
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
        // Scope clubs to this assignor's assigned clubs (Admin sees all)
        let allowedClubs = null;
        const uid = currentUserId();
        if (uid) {
            const assignorRecs = await supabaseClient.getRecords('Assignors', { maxRecords: 50 });
            const myRec = assignorRecs.find(r => r.fields['auth_user_id'] === uid);
            if (myRec && (myRec.fields['Role'] || '').trim() !== 'Admin') {
                const c = myRec.fields['Clubs'];
                allowedClubs = c ? (Array.isArray(c) ? c.filter(Boolean) : [c]) : null;
            }
        }

        const clubs = await airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.CLUBS, { maxRecords: 200 });
        let names = clubs
            .map(c => c.fields['Club Name'] || c.fields['club_name'] || c.fields['Name'] || c.fields['name'] || '')
            .filter(Boolean)
            .sort();

        if (allowedClubs && allowedClubs.length > 0) {
            names = names.filter(n => allowedClubs.includes(n));
        }

        const wrap = document.getElementById('clubCheckboxes');
        if (!names.length) {
            wrap.innerHTML = '<span style="color:#e67e22; font-size:13px;">No clubs found — check clubs table.</span>';
            return;
        }
        wrap.innerHTML = names.map(n => `
            <label style="display:flex; align-items:center; gap:6px; font-weight:500; cursor:pointer; white-space:nowrap;">
                <input type="checkbox" class="club-cb" value="${n}" checked> ${n}<span class="ca-club-pending"
                    data-club="${String(n).replace(/"/g, '&quot;')}" style="display:none;"></span>
            </label>`).join('');
        loadClubPendingCounts();
        // Same trigger: by the time the club list is built the client is ready.
        loadAwaitingConfirmation();

        // Append active tournaments with 🏆 badge
        const tournRes = await supabaseClient.client.from('tournaments').select('name').eq('status', 'active').order('name');
        const tourns = (tournRes.data || []).map(t => t.name);
        tournamentNames = new Set(tourns);
        if (tourns.length) {
            wrap.innerHTML += tourns.map(n => `
                <label style="display:flex; align-items:center; gap:6px; font-weight:500; cursor:pointer; white-space:nowrap;">
                    <input type="checkbox" class="club-cb" value="${n}" checked> 🏆 ${n}
                </label>`).join('');
        }

        // Append enabled events with 📅 badge (events store games in the games table by Source Club)
        const evRes = await supabaseClient.client.from('events').select('"Club Name"').eq('enabled', true).order('"Club Name"');
        let evNames = (evRes.data || []).map(e => e['Club Name']).filter(Boolean);
        if (allowedClubs && allowedClubs.length > 0) {
            evNames = evNames.filter(n => allowedClubs.includes(n));
        }
        if (evNames.length) {
            wrap.innerHTML += evNames.map(n => `
                <label style="display:flex; align-items:center; gap:6px; font-weight:500; cursor:pointer; white-space:nowrap;">
                    <input type="checkbox" class="club-cb" value="${n}" checked> 📅 ${n}
                </label>`).join('');
        }
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

        // Load games, referee CA IDs, venues, fields, clubs, and pay rates in parallel
        progressText.textContent = 'Loading games, referees, venues, and fields...';
        const selectedTournaments = selectedClubs.filter(c => tournamentNames.has(c));
        const tournGamesPromise = selectedTournaments.length
            ? (() => {
                let tq = supabaseClient.client.from('tournament_games').select('*')
                    .in('Source Club', selectedTournaments);
                if (dateFrom) tq = tq.gte('date', dateFrom);
                if (dateTo)   tq = tq.lte('date', dateTo);
                return tq.then(r => r.data || []);
              })()
            : Promise.resolve([]);

        const [records, referees, venues, fieldRecs, clubRecs, payRatesResult, tournRaw, assignorRecs] = await Promise.all([
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.GAMES,    options),
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.REFEREES, { maxRecords: 1000 }),
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.VENUES,   { maxRecords: 500 }),
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.FIELDS,   { maxRecords: 500 }),
            airtableClient.getRecords(CONFIG.AIRTABLE_TABLES.CLUBS,    { maxRecords: 200 }),
            supabaseClient.client.from('pay_rates').select('*').then(r => r.data || []),
            tournGamesPromise,
            supabaseClient.getRecords('Assignors', { maxRecords: 50 })
        ]);

        // Normalize tournament_games rows into the same {id, fields} shape as regular games
        const normTournGame = g => ({
            id: String(g.id),
            fields: {
                'Date':            g.date            || '',
                'Time':            g.time            || '',
                'Age Group':       g['Age Group']    || '',
                'Home Team':       g['Home Team']    || '',
                'Away Team':       g['Away Team']    || '',
                'Center Referee':  g['Center Referee'] || null,
                'AR 1':            g['AR 1']         || null,
                'AR 2':            g['AR 2']         || null,
                'Source Club':     g['Source Club']  || '',
                'Venue ID':        g['Venue ID']     || null,
                'Field ID':        g['Field ID']     || null,
                'Gender':          g['Gender']       || '',
                'Game Status':     g['Game Status']  || '',
                'home_club':       g['home_club']    || '',
                'away_club':       g['away_club']    || '',
                'game_type':       'Comp',
            },
            // Tournament games are a different TABLE, not a different shape.
            // Without this the export stamp would be written to games.id and
            // silently update whatever club game happens to hold that id.
            _table: 'tournament_games',
        });
        const allRecords = [...records, ...tournRaw.map(normTournGame)];

        // ── Assignor per club ────────────────────────────────────────────────
        // CA's Add Game form marks Assignor REQUIRED, and the only route to it in
        // the CSV is Primary/Secondary Assignor Email. We were sending both blank,
        // which may well be what killed the July upload rather than the fee bug
        // Ron was chasing.
        //
        // There is no assignor on the game — games.assignor_id is null across the
        // board — so the club is the link: assignors.clubs is the array that says
        // who assigns what.
        assignorsByClub = {};
        const _uid = (typeof currentUserId === 'function') ? currentUserId() : null;
        myAssignorEmail = '';
        (assignorRecs || []).forEach(r => {
            const f = r.fields || {};
            const email = f['email'] || f['Email'] || '';
            if (!email) return;
            if (_uid && f['auth_user_id'] === _uid) myAssignorEmail = email;
            const cl = f['clubs'] || f['Clubs'] || [];
            (Array.isArray(cl) ? cl : [cl]).filter(Boolean).forEach(c => {
                (assignorsByClub[String(c).trim().toLowerCase()] ||= []).push({ name: f['name'] || f['Name'] || '', email });
            });
        });

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

        // Build club → CA league lookups + club name → integer id
        clubLeagueMap     = {};
        clubLeagueNameMap = {};
        clubIdMap         = {};
        clubRecs.forEach(c => {
            const clubName = c.fields['name'] || c.fields['Club Name'] || c.fields['Name'] || '';
            const leagueId = c.fields['ca_league_id'];
            // ca_league is a TEXT column holding a JSON ARRAY — a club can play in more
            // than one league, so Entity Status stores e.g. ["CT Northeast District
            // Travel League","General Non-League Games"]. Reading it raw would have put
            // the brackets and quotes into CA's League column verbatim.
            // The FIRST entry is the club's default; a per-game override (General
            // Non-League Games) is still to be built.
            const leagueNm = parseClubLeagues(c.fields['ca_league'])[0] || '';
            if (clubName && leagueId) clubLeagueMap[clubName] = parseInt(leagueId);
            if (clubName && leagueNm) clubLeagueNameMap[clubName] = leagueNm;
            if (clubName) clubIdMap[clubName] = parseInt(c.id);
        });

        // Build EVENT overrides (league, duration, crew size, pay) from event age_groups JSONB
        // — events only, clubs untouched
        eventLeagueMap   = {};
        eventDurationMap = {};
        eventCrewMap     = {};
        eventRateMap     = {};
        try {
            const { data: evRows } = await supabaseClient.client
                .from('events').select('"Club Name", age_groups').eq('enabled', true);
            (evRows || []).forEach(ev => {
                const nm = ev['Club Name'] || '';
                if (!nm) return;
                (Array.isArray(ev.age_groups) ? ev.age_groups : []).forEach(ag => {
                    if (ag.ca_league_id != null) eventLeagueMap[nm] = parseInt(ag.ca_league_id);
                    if (!ag.age_group) return;
                    const k = String(ag.age_group).replace(/\s.*$/, '').replace(/[BGbg]$/, '').toUpperCase();
                    if (ag.duration) {
                        if (!eventDurationMap[nm]) eventDurationMap[nm] = {};
                        eventDurationMap[nm][k] = { duration: ag.duration, durationTime: ag.durationTime };
                    }
                    // Crew size: the event config says which of AR1 / AR2 are used.
                    // GSL runs a solo centre, so this must not silently become 3.
                    if (!eventCrewMap[nm]) eventCrewMap[nm] = {};
                    eventCrewMap[nm][k] = 1 + (ag.ar1 ? 1 : 0) + (ag.ar2 ? 1 : 0);
                    if (ag.center != null || ag.ar != null) {
                        if (!eventRateMap[nm]) eventRateMap[nm] = {};
                        eventRateMap[nm][k] = { center: ag.center, ar: ag.ar };
                    }
                });
            });
        } catch(e) { /* event overrides optional */ }

        // Build pay rate lookup: club_id → age band → {center, ar}
        payRateByClubId = {};
        (payRatesResult || []).forEach(pr => {
            if (!payRateByClubId[pr.club_id]) payRateByClubId[pr.club_id] = {};
            payRateByClubId[pr.club_id][pr.age_group] = { center: pr.center, ar: pr.ar };
        });

        progressBar.style.width = '100%';
        progressText.textContent = 'Done!';

        // Strip cancelled games — never export these
        const active = allRecords.filter(r => (r.fields['Game Status'] || '').toLowerCase() !== 'cancelled');

        // Club filter — exact match on Source Club field
        const byClub = selectedClubs.length === 0 ? active : active.filter(r => {
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
    const { name, caId, fieldName } = resolveVenue(f);
    const fieldPart = fieldName
        ? `<br><span style="color:#555;font-size:11px;">⛳ ${fieldName}</span>`
        : `<br><span style="color:#aaa;font-size:11px;">field —</span>`;
    return caId
        ? `<span style="color:#1a7a40;font-weight:600;" title="CA ID: ${caId}">✓ ${name || caId}</span>${fieldPart}`
        : `<span style="color:#c0392b;font-weight:600;" title="${name || 'Unknown'}">⚠ ${name || 'No Venue ID'}</span>${fieldPart}`;
}

function genderBadge(val) {
    const g = (val || '').trim();
    if (['Boys','Male'].includes(g))    return `<span style="color:#1a7a40;font-weight:600;">M</span>`;
    if (['Girls','Female'].includes(g)) return `<span style="color:#1a7a40;font-weight:600;">F</span>`;
    if (g === 'Coed')                   return `<span style="color:#1a7a40;font-weight:600;">Co</span>`;
    return `<span style="color:#c0392b;font-weight:600;" title="Gender not set — will default to F in export">⚠</span>`;
}

function fmtTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h)) return t;
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function renderGamesTable(records) {
    // Summary counts
    let venueOk = 0, refOk = 0, genderOk = 0, fieldOk = 0;
    records.forEach(rec => {
        const f = rec.fields;
        const v = resolveVenue(f);
        if (v.caId)      venueOk++;
        if (v.fieldName) fieldOk++;
        const cr = extractRefVal(f['Center Referee']);
        if (cr && resolveRefCA(cr)) refOk++;
        const g = (f['Gender'] || '').trim();
        if (['Boys','Male','Girls','Female','Coed'].includes(g)) genderOk++;
    });
    const total = records.length;
    gameCount.innerHTML = `
        <span style="font-weight:700;">${total} game${total !== 1 ? 's' : ''}</span>
        &nbsp;|&nbsp;
        <span style="color:${venueOk===total?'#27ae60':'#e67e22'}">Venues: ${venueOk}/${total} ✓</span>
        &nbsp;|&nbsp;
        <span style="color:${genderOk===total?'#27ae60':'#c0392b'}">Gender: ${genderOk}/${total} ✓</span>
        &nbsp;|&nbsp;
        <span style="color:${fieldOk===total?'#27ae60':'#aaa'}">Field: ${fieldOk}/${total}</span>
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
        <th style="width:10%;">Club</th>
        <th style="width:18%;">Home</th>
        <th style="width:18%;">Away</th>
        ${sortHdr('age','Age','44px')}
        <th style="width:36px;">M/F</th>
        <th style="width:18%;">Venue / Field</th>
        <th style="width:52px;">CR</th>
        <th style="width:52px;">AR1</th>
        <th style="width:52px;">AR2</th>
        <th style="width:80px;" title="Previously exported to CA">Prior</th>
    </tr></thead><tbody>`;

    records.forEach((rec, i) => {
        const f = rec.fields;
        // Three states, and only the last one means the game is actually in CA.
        const importedAt = f['ca_imported_at'] || null;
        const exportedAt = f['ca_exported_at'] || getExportedAt(f);
        const priorBadge = importedAt
            ? `<span style="color:#2ecc71;font-size:11px;white-space:nowrap;font-weight:700;" title="Confirmed in Central Assign ${fmtExportDate(importedAt)}">✓ in CA</span>`
            : exportedAt
                ? `<span style="color:#e67e22;font-size:11px;white-space:nowrap;font-weight:600;" title="Exported ${fmtExportDate(exportedAt)} — not yet confirmed in CA">⚠ sent ${fmtExportDate(exportedAt)}</span>`
                : `<span style="color:#aaa;font-size:11px;">—</span>`;
        const rowBg = importedAt
            ? 'background:rgba(46,204,113,0.10);'
            : exportedAt
                ? 'background:rgba(230,126,34,0.08);'
                : (i % 2 === 0 ? 'background:rgba(15,52,96,0.28);' : '');
        html += `<tr style="font-size:0.78rem;${rowBg}">
            <td style="padding:5px 4px;"><input type="checkbox" class="game-check" data-index="${i}" checked></td>
            <td style="color:#999;padding:5px 4px;">${i + 1}</td>
            <td style="white-space:nowrap;">${formatDate(f['Date'] || '')}</td>
            <td style="white-space:nowrap;">${fmtTime(f['Time'] || '')}</td>
            <td style="font-size:11px;color:#555;">${f['Source Club'] || ''}</td>
            <td style="word-break:break-word;">${f['Home Team'] || ''}</td>
            <td style="word-break:break-word;">${f['Away Team'] || ''}</td>
            <td style="text-align:center;">${f['Age Group'] || ''}</td>
            <td style="text-align:center;">${genderBadge(f['Gender'])}</td>
            <td>${venueBadge(f)}</td>
            <td>${refBadge(f['Center Referee'])}</td>
            <td>${refBadge(f['AR 1'])}</td>
            <td>${refBadge(f['AR 2'])}</td>
            <td style="cursor:pointer;" onclick="toggleGameCA(${i}, event)"
                title="Click to mark this game in / out of Central Assign">${priorBadge}</td>
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

    // NOTE: the "games only" checkbox no longer changes anything. CA's CSV
    // importer has no referee columns at all, so every export is games-only and
    // assignments are made inside Central Assign.

    // Gender check — block export if any selected game is missing gender
    const missingGender = selected.filter(rec => {
        const g = (rec.fields['Gender'] || '').trim();
        return !['Boys','Male','Girls','Female','Coed'].includes(g);
    });
    if (missingGender.length > 0) {
        const lines = missingGender.map(rec => {
            const f = rec.fields;
            return `  • ${formatDate(f['Date'])} ${fmtTime(f['Time'])} — ${f['Home Team']} vs ${f['Away Team']}`;
        }).join('\n');
        alert(`⚠️ ${missingGender.length} game${missingGender.length > 1 ? 's are' : ' is'} missing a Gender value and cannot be exported:\n\n${lines}\n\nFix the Gender field in the database before exporting.`);
        return;
    }

    // League check — a game with no resolvable CA league name cannot be exported.
    // No default: a wrong league silently files the games under another district.
    const missingLeague = selected.filter(rec => !resolveLeague(rec.fields));
    if (missingLeague.length > 0) {
        const clubs = [...new Set(missingLeague.map(r => r.fields['Source Club'] || '(no club)'))];
        alert(
            `⛔ ${missingLeague.length} game${missingLeague.length > 1 ? 's have' : ' has'} no Central Assign league and cannot be exported.\n\n` +
            `Missing a league:\n${clubs.map(c => '  • ' + c).join('\n')}\n\n` +
            `Set the CT district on the club (or the event's age group) first. ` +
            `Central Assign matches the league by name — guessing puts the games in the wrong district, ` +
            `where they vanish from your list until CA staff move them back.`
        );
        return;
    }

    // Duplicate check — warn before allowing re-export
    // -- Duplicate guard -----------------------------------------------------
    // Two very different situations used to raise the same alarm:
    //
    //   CONFIRMED in CA   - re-exporting genuinely risks a duplicate fixture.
    //   sent, unconfirmed - re-exporting is usually the RIGHT move: CA rejected
    //                       the file, the venue got fixed, it goes again.
    //
    // Warning identically about both taught the reflex to click through, which
    // is exactly the click that creates the duplicate. Only the confirmed set
    // raises a stop now; the amber set is mentioned and waved past.
    //
    // The old guard read getExportedAt() -- localStorage. That made it
    // per-browser: on another machine, or after clearing site data, every game
    // looked never-exported and the warning never fired at all. It reads the
    // row now.
    const lineFor = rec => {
        const f = rec.fields;
        return `  \u2022 ${formatDate(f['Date'])} ${fmtTime(f['Time'])} \u2014 ${f['Home Team']} vs ${f['Away Team']}`;
    };
    const confirmedInCA   = selected.filter(rec => rec.fields['ca_imported_at']);
    const sentUnconfirmed = selected.filter(rec =>
        !rec.fields['ca_imported_at'] && (rec.fields['ca_exported_at'] || getExportedAt(rec.fields)));

    if (confirmedInCA.length > 0) {
        const n = confirmedInCA.length;
        const proceed = confirm(
            `\u26a0\ufe0f STOP \u2014 Central Assign already has ${n} of these games:\n\n`
            + `${confirmedInCA.map(lineFor).join('\n')}\n\n`
            + `You confirmed ${n > 1 ? 'them' : 'it'} as imported, so exporting again will create `
            + `duplicate fixture${n > 1 ? 's' : ''} in CA.\n\n`
            + `Only continue if you are deliberately re-sending after a change.\n\nExport anyway?`
        );
        if (!proceed) return;
    }

    if (sentUnconfirmed.length > 0) {
        const n = sentUnconfirmed.length;
        const proceed = confirm(
            `${n} game${n > 1 ? 's were' : ' was'} exported before but never confirmed in Central Assign:\n\n`
            + `${sentUnconfirmed.map(lineFor).join('\n')}\n\n`
            + `That usually means CA did not take ${n > 1 ? 'them' : 'it'}, so re-exporting is fine.\n\nContinue?`
        );
        if (!proceed) return;
    }

    // Headers matched exactly to CA's game_import_sample.csv (24 columns).
    // Referee assignments are NOT part of this format — CA dropped the
    // Referee Id / AR1 / AR2 / Assessor columns. Games go up unassigned and
    // are assigned inside Central Assign.
    const headers = [
        'Date', 'Time', 'League', 'Age Group', 'Gender', '# Refs',
        'Half Length (min)', 'Home Team', 'Visiting Team', 'Venue', 'Field',
        'Division', 'Game Type', 'Home Club', 'Visiting Club',
        'Home Coach Email', 'Visiting Coach Email',
        'Primary Assignor Email', 'Secondary Assignor Email',
        'External System', 'External Game ID',
        'Referee Fee', 'AR Fee', 'Fourth Official Fee'
    ];

    const rows = selected.map(rec => {
        const f = rec.fields;
        const src = f['Source Club'] || '';
        // caId/fieldCaId are deliberately unused in the row: CA's importer wants
        // names. They stay resolved because they are how we identify the venue.
        const { name: venueName, fieldName } = resolveVenue(f);

        // Gender — CA wants the full word, not M/F
        const gRaw = (f['Gender'] || '').trim();
        const gameGender = ['Male','Boys'].includes(gRaw)   ? 'Male'
                         : ['Female','Girls'].includes(gRaw) ? 'Female'
                         : 'Coed';

        // Age group — strip B/G suffix and division label before lookup
        const ageGroup = f['Age Group'] || '';
        const ageKey = ageGroup.replace(/\s.*$/, '').replace(/[BGbg]$/, '').toUpperCase();

        // Half length in minutes, parsed out of "2 x 35"
        const evDur = eventDurationMap[src]?.[ageKey];
        const { duration } = evDur || DURATION_BY_AGE[ageKey] || { duration: '2 x 40' };
        const halfLength = halfLengthFromDuration(duration);

        // Crew size = how many EMPTY referee slots CA opens on the game.
        // This is CA's number, not ours: CA validates it against its own league
        // configuration per league + age group and rejects the whole row on a
        // mismatch ("# Refs 1 does not match league configuration (3) for
        // CT Northeast District Travel League U19"). Do NOT derive it from our
        // ar1/ar2 flags — those describe how WE staff a game, which is a
        // separate question from how many positions CA expects to exist.
        const crew = ageKey === 'U8' ? 1 : 3;

        // Fees — event age_group rates first, then club pay_rates, then defaults
        //
        // ageBand takes ageKEY, not the raw age group. Handed "U12 Silver" it
        // strips the space to "U12SILVER", matches no band, returns null, and
        // every rate silently falls through to DEFAULTS — East Haddam's U12
        // games exported at 40/25 instead of their real 50/35. Any club whose
        // age groups carry a division label was affected, which is most of them.
        const assignorEmails = assignorEmailsFor(src);
        const band     = ageBand(ageKey);
        const clubId   = clubIdMap[src];
        const evRates  = eventRateMap[src]?.[ageKey] || null;
        // Rec and Comp are DIFFERENT RATES, not duplicates.
        //
        // The pay editor has two grids: Rec by single age (U8, U10, U12, U15,
        // U18, U19) and Comp by band (U9-U10, U11-U12, U13-U15). They never
        // collide as strings, which is why both live in one table keyed on
        // age_group alone. Reading only the band therefore charged Rec games a
        // Comp rate wherever a club had both — Lebanon's Rec U10 is 40 and its
        // Comp U9-U10 is 50 — and missed entirely for a club with only one
        // shape. NECONN keeps Rec ages and no bands, so every NECONN game fell
        // through to DEFAULTS: U12 exported 40/25 against a real 45/30, U15 and
        // U19 40/25 against 60/35.
        //
        // So the GAME says which rate applies. The other shape is a fallback,
        // because a club that has only entered one grid still means it.
        const isComp   = String(f['game_type'] || '').trim().toLowerCase() === 'comp';
        const rateFor  = k => (k && clubId) ? (payRateByClubId[clubId]?.[k] || null) : null;
        const clubRate = isComp ? (rateFor(band) || rateFor(ageKey))
                                : (rateFor(ageKey) || rateFor(band));

        // Whether we actually USE ARs is ours, and it drives the AR fee.
        // A solo-centre event (GSL) gets 3 slots in CA but a $0 AR fee, so an
        // unfilled AR position never implies a payment.
        //
        // ⚠️ A NULL AR rate on a club's pay_rates means THIS CLUB DOES NOT USE
        // ARs at that age — it is not "no rate recorded, use the default".
        // NECONN pays no AR at U8 or U10 and says so on its own profile card,
        // and every U10 game was still exporting an AR fee of 25 because null
        // fell through to DEFAULTS.arRate. A missing rate was reading as a
        // missing entry rather than as the policy it is.
        const clubHasRow    = !!clubRate;
        const clubSaysNoARs = clubHasRow && (clubRate.ar === null || clubRate.ar === undefined);
        const usesARs = eventCrewMap[src]?.[ageKey] != null ? eventCrewMap[src][ageKey] > 1
                      : clubSaysNoARs                       ? false
                      : true;

        const refFee   = evRates?.center ?? clubRate?.center ?? DEFAULTS.refRate;
        const arFee    = usesARs ? (evRates?.ar ?? clubRate?.ar ?? DEFAULTS.arRate) : 0;
        const fourthFee = DEFAULTS.fourthRate;

        return [
            formatDateForExport(f['Date'] || ''),
            formatTimeForExport(f['Time'] || ''),
            resolveLeague(f),
            ageKey,
            gameGender,
            crew,
            halfLength,
            f['Home Team'] || '',
            f['Away Team'] || '',
            // NAMES, not numbers — Central Assign's importer said so itself.
            // 2026-09-03: a file with 867 in this column came back "Venue '867'
            // not found in the system" on every row, while every other column
            // passed. CA's own sample uses names, and the July upload that got
            // through validation used names too.
            //
            // The CA id rule still holds where it came from — the Venue Field
            // column on the OLD format — but the CSV importer resolves by name.
            // We keep both numbers in the database as identity (that is how we
            // know which venue is which); they are just not what goes in the file,
            // which is why the venue directory harvest still mattered.
            venueName,
            fieldName || '',
            '',                      // Division — we don't carry one
            DEFAULTS.type,
            // Home Club and Visiting Club are REQUIRED on CA's Add Game form, and
            // they are DROPDOWNS there — the club has to be one of CA's own names
            // while the team beside it is free text. Blank was never going to
            // import. These come from games.home_club / games.away_club, which the
            // club portal now writes from that same list (see sql/ca-clubs.sql).
            // Games entered before 2026-09-03 have neither, so they export blank
            // and CA will reject them until the club is filled in — visible and
            // fixable, rather than wrong and accepted.
            f['home_club'] || '',
            f['away_club'] || '',
            '',                      // Home Coach Email
            '',                      // Visiting Coach Email
            assignorEmails.primary,
            assignorEmails.secondary,
            DEFAULTS.externalSys,
            rec.id || '',            // our game id, so a re-import can be matched
            refFee,
            arFee,
            fourthFee
        ].map(csvCell).join(',');
    });

    // No BOM, CRLF endings — byte-for-byte the shape of CA's own
    // game_import_sample.csv, and of the file CA's importer parsed cleanly.
    const content = [headers.map(csvCell).join(','), ...rows].join('\r\n') + '\r\n';
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date();
    const datePart = ts.toISOString().split('T')[0];
    const timePart = `${String(ts.getHours()).padStart(2,'0')}${String(ts.getMinutes()).padStart(2,'0')}`;
    a.download = `central-assign-export-${datePart}-${timePart}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    // Mark all exported games, then ask whether CA actually took them.
    markAsExported(selected).then(res => {
        // The records are handed over too, so "Some imported" can list the exact
        // rows in the exact order they appear in the file CA is reading.
        showCAConfirmBar(res, selected);
        renderGamesTable(loadedGames);
    });
});

// -- Previous uploads awaiting confirmation ----------------------------------
// A game that has been exported but never confirmed is the one state that used
// to be unreachable: the confirm bar lives for a few seconds after an export,
// which is BEFORE Central Assign has said anything. By the time Tod knows the
// answer it is gone, and the only way back was to guess a date range, uncheck
// the right filters and reload the whole games table.
//
// So this stands on its own at the top of the page and loads itself.
let _awaiting = [];

async function loadAwaitingConfirmation() {
    const host = document.getElementById('caAwaitingPanel');
    if (!host) return;
    try {
        const today = new Date().toISOString().slice(0, 10);
        const { data, error } = await supabaseClient.client
            .from('games')
            // ⚠️ select('*') on purpose. The games table mixes conventions —
            // "Source Club" is quoted and capitalised, `date` and `time` are
            // plain lowercase — and naming columns here got it wrong twice in
            // one morning, failing silently into the catch and hiding the panel.
            .select('*')
            .is('ca_imported_at', null)
            .not('ca_exported_at', 'is', null)
            .gte('date', today)
            .order('date');
        if (error) throw new Error(error.message);
        _awaiting = (data || []).filter(g => (g['Game Status'] || '') !== 'Cancelled');
        if (!_awaiting.length) { host.style.display = 'none'; return; }

        const rows = _awaiting.map((g, i) => `
            <label style="display:flex;align-items:center;gap:10px;padding:4px 0;font-size:0.84rem;cursor:pointer;">
                <input type="checkbox" class="ca-await-cb" data-idx="${i}" checked>
                <span style="min-width:150px;color:#ffd479;">${g['Source Club'] || ''}</span>
                <span style="min-width:88px;">${g.date || ''}</span>
                <span style="min-width:74px;">${fmtTime(g['Time'] || g.time) || ''}</span>
                <span style="min-width:48px;color:#9fb0c8;">${g['Age Group'] || ''}</span>
                <span>${g['Home Team'] || g.home_team || '?'} vs ${g['Away Team'] || g.away_team || '?'}</span>
            </label>`).join('');

        host.style.display = 'block';
        host.innerHTML = `<div style="background:#7d5a00;border:1px solid #e67e22;border-radius:10px;padding:14px 18px;color:#fff;">
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px;">
                <span style="font-size:0.8rem;font-weight:900;letter-spacing:1.3px;color:#ffd479;">⚠ CONFIRM PREVIOUS UPLOADS</span>
                <span style="font-size:0.88rem;flex:1;min-width:220px;">
                    ${_awaiting.length} game${_awaiting.length === 1 ? '' : 's'} exported but never confirmed in Central Assign.
                </span>
                <button onclick="confirmAwaiting(true)" style="background:#1e8449;color:#fff;border:none;border-radius:6px;
                    padding:6px 14px;font-weight:800;font-size:0.8rem;cursor:pointer;">✓ CA has these</button>
                <button onclick="confirmAwaiting(false)" style="background:none;color:#ffd479;border:1px solid #e67e22;
                    border-radius:6px;padding:6px 12px;font-weight:700;font-size:0.8rem;cursor:pointer;">Still not sent</button>
            </div>
            <div style="max-height:240px;overflow:auto;border-top:1px solid rgba(255,255,255,0.15);padding-top:6px;">${rows}</div>
            <div style="font-size:0.74rem;color:#e8d9b0;margin-top:8px;">
                Untick anything Central Assign did not take. A game CA reported as a duplicate,
                or as a field conflict against your own fixture, IS in CA — tick those.
            </div>
        </div>`;
    } catch (e) {
        // Loud, not silent. The first version swallowed a column-name error and
        // simply did not render, which reads exactly like "nothing to confirm".
        console.error('awaiting-confirmation panel failed', e);
        host.style.display = 'block';
        host.innerHTML = `<div style="background:#5b1a12;border:1px solid #c0392b;border-radius:10px;
            padding:10px 16px;color:#ffd0c8;font-size:0.82rem;">
            Could not load games awaiting confirmation: ${String(e.message || e)}</div>`;
    }
}

// "Still not sent" clears ca_exported_at so the game drops back to plain red
// rather than sitting amber forever — the honest state for a file that never
// actually reached CA.
async function confirmAwaiting(inCA) {
    const picked = [...document.querySelectorAll('.ca-await-cb:checked')]
        .map(cb => _awaiting[parseInt(cb.dataset.idx, 10)])
        .filter(Boolean);
    if (!picked.length) { alert('Nothing ticked.'); return; }
    const ids = picked.map(g => g.id);
    const patch = inCA ? { ca_imported_at: new Date().toISOString() } : { ca_exported_at: null };
    try {
        const { error } = await supabaseClient.client.from('games').update(patch).in('id', ids);
        if (error) throw new Error(error.message);
        await loadAwaitingConfirmation();
        if (typeof loadClubPendingCounts === 'function') loadClubPendingCounts();
        if (typeof loadedGames !== 'undefined' && loadedGames.length) {
            loadedGames.forEach(rec => {
                if (ids.includes(parseInt(rec.id, 10))) Object.assign(rec.fields, patch);
            });
            renderGamesTable(loadedGames);
        }
    } catch (e) {
        alert('Could not update: ' + e.message);
    }
}

// -- Per-club backlog on the club checkboxes ---------------------------------
// Same universe as the admin banner and the workstation pills: ALL upcoming
// games not yet CONFIRMED in Central Assign. Counting the loaded date range
// instead would make three screens disagree about the same number.
//
// Club names here come from the clubs table; the count is keyed on a game's
// "Source Club", and the two are not always spelled the same way. Matched
// case-insensitively for that reason.
async function loadClubPendingCounts() {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const { data, error } = await supabaseClient.client
            .from('games')
            .select('id, "Source Club", "Game Status"')
            .is('ca_imported_at', null)
            .gte('date', today);
        if (error) throw new Error(error.message);
        const map = {};
        (data || []).forEach(g => {
            if ((g['Game Status'] || '') === 'Cancelled') return;
            const c = (g['Source Club'] || '').trim().toLowerCase();
            if (c) map[c] = (map[c] || 0) + 1;
        });
        document.querySelectorAll('.ca-club-pending').forEach(el => {
            const k = map[(el.dataset.club || '').trim().toLowerCase()] || 0;
            // Nothing shown for a club that is clear - a zero on every row is
            // noise, and the absence already says there is nothing to do.
            if (!k) { el.style.display = 'none'; return; }
            el.textContent = k;
            el.title = k + ' game' + (k === 1 ? '' : 's') + ' not yet confirmed in Central Assign';
            el.style.cssText = 'display:inline-block;margin-left:5px;background:#c0392b;color:#fff;'
                + 'font-size:11px;font-weight:800;border-radius:8px;padding:0 6px;line-height:16px;';
        });
    } catch (e) {
        console.warn('club pending counts unavailable', e);
    }
}


// ── Helpers ───────────────────────────────────────────────────────────────────

// Quote a value for CSV. Anything with a comma, quote, or newline gets wrapped
// and its quotes doubled. Times like "5:30 PM" and team names with commas in
// them both go through here.
function csvCell(v) {
    const s = (v === null || v === undefined) ? '' : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// "2 x 35" → 35. CA wants the half length as a bare number of minutes.
function halfLengthFromDuration(duration) {
    const m = String(duration || '').match(/(\d+)\s*$/);
    return m ? parseInt(m[1]) : '';
}

// Resolve a game's Central Assign league NAME. Returns '' when it cannot be
// resolved — the caller refuses to export rather than guessing.
//   1. clubs.ca_league  (text, exactly as CA spells it)   ← preferred
//   2. legacy numeric ca_league_id, translated
function resolveLeague(f) {
    const src = f['Source Club'] || '';
    if (!src) return '';
    const byName = clubLeagueNameMap[src];
    if (byName) return byName;
    const numeric = eventLeagueMap[src] ?? clubLeagueMap[src];
    if (numeric != null && CA_LEAGUE_NAMES[numeric]) return CA_LEAGUE_NAMES[numeric];
    return '';
}

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

// Field IDs at or above this are invented placeholders, not numbers CA ever issued.
// Sequential-from-9000 is what someone types when they need a number and don't have
// one — see `Central Assign/Venues/README.md`. Uploading one would send CA a field it
// has never heard of, so they are treated as "no CA number" and fall back to the name.
const INVENTED_FIELD_ID_FLOOR = 9000;

// Resolve venue info from a game's fields object.
// Primary path: use numeric Venue ID / Field ID (set by assignor workstation).
// Fallback: old Airtable linked-record approach.
// Returns { name, caId, fieldCaId, fieldName } — caId is the CA venue number,
// fieldCaId is the CA field number (null unless it's a real one).
function resolveVenue(f) {
    const numVenueId = f['Venue ID'] ? (parseInt(f['Venue ID']) || null) : null;
    const numFieldId = f['Field ID'] ? (parseInt(f['Field ID']) || null) : null;
    const realFieldId = (numFieldId && numFieldId < INVENTED_FIELD_ID_FLOOR) ? numFieldId : null;

    if (numVenueId) {
        return {
            name:      numericVenueToName[numVenueId] || String(numVenueId),
            caId:      numVenueId,   // Venue ID IS the CA venue ID
            fieldCaId: realFieldId,
            fieldName: numFieldId ? (numericFieldToName[numFieldId] || '') : ''
        };
    }

    // Legacy fallback: old Airtable linked records stored as arrays or JSON strings
    let fieldValue = f['Venue'] || f['Field'];
    if (typeof fieldValue === 'string' && fieldValue.startsWith('[')) {
        try { fieldValue = JSON.parse(fieldValue); } catch(e) {}
    }
    if (!fieldValue) return { name: '', caId: null, fieldCaId: null, fieldName: '' };
    // Normalize: unwrap array or use raw integer/string ID directly
    const rid = Array.isArray(fieldValue) ? fieldValue[0] : fieldValue;
    return {
        name:      venueNameMap[rid] || String(rid),
        caId:      venueCAId[rid]    || null,
        fieldCaId: realFieldId,
        fieldName: fieldNameMap[rid] || ''
    };
}

function assignorEmailsFor(club) {
    const list = assignorsByClub[String(club || '').trim().toLowerCase()] || [];
    if (!list.length) return { primary: '', secondary: '' };
    if (list.length === 1) return { primary: list[0].email, secondary: '' };
    // Co-assigned. The person generating the file is the primary on it; the other
    // rides along as secondary. Eric exporting the same club gets the mirror.
    const mine  = list.find(a => a.email === myAssignorEmail);
    const first = mine || list[0];
    const other = list.find(a => a.email !== first.email);
    return { primary: first.email, secondary: other ? other.email : '' };
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parseInt(parts[1])}/${parseInt(parts[2])}/${parts[0]}`;
}

// CA's sample uses zero-padded MM/DD/YYYY ("09/15/2026")
function formatDateForExport(dateStr) {
    if (!dateStr) return '';
    const parts = String(dateStr).slice(0, 10).split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${String(parseInt(m)).padStart(2,'0')}/${String(parseInt(d)).padStart(2,'0')}/${y}`;
}

function formatTimeForExport(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${period}`;
}
