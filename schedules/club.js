/* ═══════════════════════════════════════════════════════════════════════════
   Public club schedule — markup + logic.

   Shared by /schedules/club.html?club=X and every generated /<club>/schedule/
   stub, so a bug fix lands everywhere at once. The stubs are ~15 lines and
   never need regenerating when this file changes — only when a club is ADDED.

   Which club to draw comes from window.CLUB_SLUG when a stub baked it in,
   otherwise from ?club= on the query string. Both routes stay supported: every
   ?club= link already handed out has to keep working forever.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
'use strict';

const SHELL = `
<div class="shell">
<div class="page">

  <header>
    <div class="logo-mark" style="position:absolute;top:12px;right:14px;--sz:54px;">
      <div class="lcard lcard-red"></div>
      <div class="lcard lcard-yellow"></div>
      <div class="logo-text">
        <span class="logo-line1">Referee</span>
        <span class="logo-line2">Tool</span>
        <span class="logo-underline"></span>
      </div>
    </div>
    <h1 id="clubName">Schedule</h1>
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:var(--accent);margin:4px 0 6px;">Schedule</div>
    <p id="subhead">Loading…</p>
  </header>

  <div class="info-bar" id="infoBar"></div>

  <div class="filter-bar" id="filterBar" style="display:none;">
    <label>Filter</label>
    <select id="seasonFilter" style="display:none;"><option value="">All seasons</option></select>
    <select id="divFilter"><option value="">All divisions</option></select>
    <select id="teamFilter"><option value="">All teams</option></select>
    <select id="venueFilter"><option value="">All locations</option></select>
  </div>

  <div class="view-tabs" id="viewTabs" style="display:none;">
    <button class="view-tab is-on" data-view="list">List</button>
    <button class="view-tab" data-view="cal">Calendar</button>
  </div>

  <div class="content">
    <!-- ABOVE the schedule, not below it. Star Ems, East Haddam club admin, on
         the live page: "Your note at the bottom 'schedule changes' would be
         helpful at the top - makes the goal of the site clear." A reader should
         know what they're looking at before they read it. -->
    <div class="notes" id="notesBox" style="display:none;">
      <strong>About This Schedule</strong>
      These games update automatically — when a change is approved it appears here,
      so there is no separate copy to fall out of date. Always check here before you travel.
      <span class="notes-contact">Questions about the schedule? Contact the Club Admin or Field Coordinator — they set it.</span>
    </div>

    <div id="calWrap" style="display:none;">
      <div class="cal-nav">
        <button id="calPrev" aria-label="Previous month">‹</button>
        <span id="calTitle"></span>
        <button id="calNext" aria-label="Next month">›</button>
      </div>
      <div class="cal-grid" id="calGrid"></div>
      <div class="cal-legend" id="calLegend">Tap any highlighted day to see its games</div>
      <div id="calDetail"></div>
    </div>

    <div id="sched"><div class="state-msg">Loading schedule…</div></div>

  </div>

  <footer>
    <span><span id="footClub"></span>Schedule through <strong>Referee&nbsp;Tool</strong>
      by <a class="foot-anvil" href="mailto:tod@anvil-arts.com">Anvil&nbsp;Arts</a></span>
    <a href="https://anvil-arts.com/" target="_blank" rel="noopener" aria-label="Anvil Arts">
      <img class="foot-mark" src="/PICS/anvil.png" alt="Anvil Arts" title="Built by Anvil Arts"></a>
    <span id="stamp"></span>
  </footer>

</div>
</div>
`;
(document.getElementById('clubSchedule') || document.body).innerHTML = SHELL;

// ─────────────────────────────────────────────────────────────────────────────
// Public club schedule.  /schedules/club.html?club=East Haddam
//
// One page for every club. CLUBS ONLY, by Tod's scope call — events and
// tournaments are separate entity types with their own code paths and are
// deliberately out of scope here.
//
// PUBLIC PAGE. It renders date, time, division, matchup, venue and field, and
// NOTHING ELSE. Referee names and pay rates live on the same game rows and must
// never reach this page — most of the referee roster are minors, and publishing
// a child's name against a specific field and kickoff time on an open URL is not
// something we do. The select list below is explicit for exactly that reason:
// DO NOT change it to '*'.
// ─────────────────────────────────────────────────────────────────────────────
const SAFE_COLUMNS = 'id,date,time,"Age Group","Gender","Home Team","Away Team",field,"Venue ID","Source Club",club,status,"Game Status",season';

let GAMES = [], VENUES = {};
const TODAY = new Date().toLocaleDateString('en-CA');   // YYYY-MM-DD, local

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const esc  = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// Same normalisation the openings board uses — "U10" alone can't tell a parent
// whether it's the boys' or the girls' team playing.
function gameGender(g) {
    const raw = String(g['Gender'] || '').trim().toLowerCase();
    if (raw) {
        if (raw.startsWith('b') || raw === 'male')   return 'Boys';
        if (raw.startsWith('g') || raw === 'female') return 'Girls';
        if (raw.startsWith('c'))                     return 'Coed';
    }
    const ag = String(g['Age Group'] || '').trim();
    if (/\bgirls?\b/i.test(ag) || /\d\s*G$/i.test(ag)) return 'Girls';
    if (/\bboys?\b/i.test(ag)  || /\d\s*B$/i.test(ag)) return 'Boys';
    if (/\bcoed\b/i.test(ag))                          return 'Coed';
    return '';
}
function divisionLabel(g) {
    const ag = String(g['Age Group'] || '').trim();
    if (!ag) return '';
    const base = ag.replace(/\s*(boys?|girls?|coed)\s*$/i, '')
                   .replace(/(\d)\s*[BG]$/i, '$1').trim();
    if (!base) return ag;
    const gender = gameGender(g);
    return gender ? `${base} ${gender}` : ag;
}
function fmtDateHeading(d) {
    const dt = new Date(d + 'T12:00:00');
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${days[dt.getDay()]}, ${months[dt.getMonth()]} ${dt.getDate()}`;
}
function fmtShort(d) {
    const dt = new Date(d + 'T12:00:00');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[dt.getMonth()]} ${dt.getDate()}`;
}
function fmtTime(t) {
    if (!t) return 'TBD';
    const [h, m] = String(t).split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
const venueOf   = g => VENUES[String(g['Venue ID'])] || null;
const venueName = g => (venueOf(g) || {})['Venue Name'] || 'Location TBD';
const venueTown = g => (venueOf(g) || {}).city || '';
const venueAddr = g => {
    const v = venueOf(g); if (!v) return '';
    return [v.address, v.city, v.state].filter(Boolean).join(', ');
};
// Tap the field name, get driving directions. A parent's real question about a
// venue is "how do I get there", and 71 of 78 venues carry a street address.
// Where one is missing we still hand Maps the name and town, which is what a
// person would type anyway.
function venueMapsHref(g) {
    const v = venueOf(g); if (!v) return '';
    const q = [v['Venue Name'], v.address, v.city, v.state].filter(Boolean).join(', ');
    return 'https://maps.google.com/?q=' + encodeURIComponent(q);
}

// Season boundaries match getCurrentSeason() in club-game-submit.html — Mar-Jun
// Spring, Jul-Aug Summer, Sep-Nov Fall. Parsed LOCAL, not UTC, so a Jul 1 game
// doesn't slide back into Spring. Stored season wins; the date only fills in
// where the column is blank (2 East Haddam games). Checked across all three
// clubs: stored and derived agree on every row, so this can't contradict itself.
function seasonOf(g) {
    if (g.season) return g.season;
    const p = String(g.date || '').slice(0, 10).split('-').map(Number);
    if (p.length !== 3 || p.some(isNaN)) return '';
    const d = new Date(p[0], p[1] - 1, p[2]), m = d.getMonth() + 1, y = d.getFullYear();
    if (m >= 3 && m <= 6)  return `Spring ${y}`;
    if (m >= 7 && m <= 8)  return `Summer ${y}`;
    if (m >= 9 && m <= 11) return `Fall ${y}`;
    return `Winter ${y}`;
}
let ACTIVE_SEASON = '';    // clubs.active_season — what the club says it is in

// The season the club is IN. `active_season` is set deliberately in superadmin,
// and flipping it there has to carry this page with it — that flip IS the
// season change, and a public schedule that ignored it would contradict the
// system of record. (Tod: "anytime we flip the season, that schedule probably
// needs to be flipped too, as part of the process.")
//
// Only when no season has been declared do we fall back to reading the dates:
// today's season if the club has games in it, else the most recent one that does.
function primarySeason(rows) {
    if (ACTIVE_SEASON) return ACTIVE_SEASON;
    const now = seasonOf({ date: TODAY });
    const seasons = [...new Set(rows.map(seasonOf).filter(Boolean))];
    if (seasons.includes(now)) return now;
    const latest = rows.map(g => g.date).filter(Boolean).sort().pop();
    return latest ? seasonOf({ date: latest }) : now;
}

const seasonIcon = s => /spring/i.test(s) ? '🌱' : /summer/i.test(s) ? '☀️'
                      : /fall/i.test(s) ? '🍂' : /winter/i.test(s) ? '❄️' : '';

// The month span of a season label, zero-indexed, mirroring seasonOf(). Fall
// starts in September, so the last spring games in June leave July and August
// as summer — which is why a club flipped to Summer belongs on an August grid
// even with nothing on it, rather than falling back to June.
// Winter returns null on purpose: seasonOf() files Dec, Jan and Feb of the same
// year under one label, so it has no contiguous span. No club here plays it.
function seasonMonths(label) {
    const y = Number((String(label).match(/\d{4}/) || [])[0]);
    if (!y) return null;
    if (/spring/i.test(label)) return [y, 2, 5];    // Mar – Jun
    if (/summer/i.test(label)) return [y, 6, 7];    // Jul – Aug
    if (/fall/i.test(label))   return [y, 8, 10];   // Sep – Nov
    return null;
}

// Newest season first: year, then position within the year.
const seasonRank = s => {
    const y = Number((String(s).match(/\d{4}/) || [])[0]) || 0;
    const i = /winter/i.test(s) ? 0 : /spring/i.test(s) ? 1 : /summer/i.test(s) ? 2 : 3;
    return y * 10 + i;
};

function seasonChip(g) {
    const s = seasonOf(g); if (!s) return '';
    return `<span class="season-chip">${seasonIcon(s) || '❄️'} ${esc(s)}</span>`;
}
function fieldClass(f) {
    const s = String(f || '');
    if (/2/.test(s)) return 'field-chip f2';
    if (/3/.test(s)) return 'field-chip f3';
    return 'field-chip';
}

// The filters own the data; the two views are just different drawings of the
// same filtered set. Narrowing to one team narrows the calendar too.
//
// SEASON IS DELIBERATELY NOT IN HERE. Division, team and venue subtract games.
// Season doesn't — it decides which games sit on top and which drop to the
// archive below, and both halves are still on the page. Treating it as an
// ordinary filter is what made picking "Summer 2026" on a club with no summer
// games return an empty set and take the finished spring season down with it:
// a dead end reading "No games match that filter" with 63 games unreachable.
// renderList() and calRows() each apply the season themselves.
function filtered() {
    const dv = document.getElementById('divFilter').value;
    const tm = document.getElementById('teamFilter').value;
    const vn = document.getElementById('venueFilter').value;
    return GAMES.filter(g =>
        (!dv || divisionLabel(g) === dv) &&
        (!tm || g['Home Team'] === tm || g['Away Team'] === tm) &&
        (!vn || venueName(g) === vn));
}

function render() {
    renderList();
    renderCal();
}

// ONE renderer for a single day's games, grouped venue → time. Both the list
// and the calendar's day panel call this, so the two can never drift apart.
// A day is a real unit of schedule here: one NECONN Saturday is 17 games across
// 5 venues, which is why it gets full venue treatment rather than a popover.
function dayBlocksHTML(games) {
    const byVenue = {};
    games.forEach(g => { (byVenue[venueName(g)] = byVenue[venueName(g)] || []).push(g); });

    let html = '';
    Object.keys(byVenue).sort().forEach(vName => {
        const list = byVenue[vName], town = venueTown(list[0]);
        const href = venueMapsHref(list[0]), addr = venueAddr(list[0]);
        html += `<div class="night">
            <div class="night-header">
                ${href
                    ? `<a class="venue-link" href="${href}" target="_blank" rel="noopener">📍 ${esc(vName)} <span class="chev">›</span></a>`
                    : `<span>${esc(vName)}</span>`}
                <span class="sit-out">${esc(addr || town)}${(addr || town) ? ' · ' : ''}${list.length} game${list.length === 1 ? '' : 's'}</span>
            </div>`;
        const byTime = {};
        list.forEach(g => { (byTime[g.time || ''] = byTime[g.time || ''] || []).push(g); });
        Object.keys(byTime).sort().forEach(t => {
            html += `<div class="time-slot"><div class="time-label">${esc(fmtTime(t))}</div>`;
            byTime[t].forEach(g => {
                const div  = divisionLabel(g);
                const href = venueMapsHref(g), addr = venueAddr(g);
                // Collapsed row answers "is this my kid's game". The body answers
                // "where exactly am I going and who is home" — the two questions a
                // parent actually has, in that order.
                html += `<div class="game-item" data-gid="${esc(g.id)}">
                    <div class="game-row">
                        <span class="game-chevron">▶</span>
                        ${g.field ? `<span class="${fieldClass(g.field)}">${esc(g.field)}</span>` : ''}
                        ${div ? `<span class="div-chip">${esc(div)}</span>` : ''}
                        <span class="team">${esc(g['Home Team'] || 'TBD')}</span>
                        <span class="vs">vs</span>
                        <span class="team-b">${esc(g['Away Team'] || 'TBD')}</span>
                    </div>
                    <div class="game-body">
                        <div class="gb-grid">
                            <div><span class="gb-k">Kickoff</span><span class="gb-v">${esc(fmtDateHeading(g.date))} · ${esc(fmtTime(g.time))}</span></div>
                            <div><span class="gb-k">Division</span><span class="gb-v">${div ? esc(div) : '—'}</span></div>
                            <div><span class="gb-k">Home</span><span class="gb-v">${esc(g['Home Team'] || 'TBD')}</span></div>
                            <div><span class="gb-k">Away</span><span class="gb-v">${esc(g['Away Team'] || 'TBD')}</span></div>
                            ${g.field ? `<div><span class="gb-k">Field</span><span class="gb-v">${esc(g.field)}</span></div>` : ''}
                            <div><span class="gb-k">Season</span><span class="gb-v">${esc(seasonOf(g) || '—')}</span></div>
                        </div>
                        ${href ? `<a class="gb-map" href="${href}" target="_blank" rel="noopener">📍 ${esc(vName)}${addr ? ' — ' + esc(addr) : ''} &nbsp;›</a>` : ''}
                    </div>
                </div>`;
            });
            html += `</div>`;
        });
        html += `</div>`;
    });
    return html;
}

function renderList() {
    const rows = filtered();
    const host = document.getElementById('sched');
    if (!rows.length) {
        // Update the bar BEFORE bailing out. Returning here without touching it
        // left the last render's numbers frozen on screen — the green bar read
        // "14 GAMES" six inches under a header saying "no games posted".
        updateInfoBar([], GAMES);
        host.innerHTML = `<div class="state-msg">No games match that filter.</div>`;
        return;
    }

    // date → venue → time. A family travels to a place on a day, so that's the shape.
    const byDate = {};
    rows.forEach(g => { (byDate[g.date] = byDate[g.date] || []).push(g); });

    const block = date => {
        const isToday = date === TODAY;
        return `<div class="week-block${date < TODAY ? ' past-block' : ''}" id="d-${date}">
            <div class="week-label">${esc(fmtDateHeading(date))}${isToday ? '<span class="today-pill">Today</span>' : ''}${seasonChip(byDate[date][0])}</div>`
            + dayBlocksHTML(byDate[date]) + `</div>`;
    };

    // WHAT'S NEXT FIRST, and only THIS season. A parent opening the page in
    // August should not have to read past May. Upcoming dates run forwards from
    // today; finished ones in the same season follow below a rule, most recent
    // first. Everything from earlier seasons drops into a collapsed archive —
    // same shape the club and president portals already use.
    const seasonOfDate = d => seasonOf(byDate[d][0]);
    const PRIMARY = document.getElementById('seasonFilter').value || primarySeason(rows);

    const dates   = Object.keys(byDate);
    const current = dates.filter(d => seasonOfDate(d) === PRIMARY);
    const older   = dates.filter(d => seasonOfDate(d) !== PRIMARY);

    const upcoming = current.filter(d => d >= TODAY).sort();
    const played   = current.filter(d => d <  TODAY).sort().reverse();

    // A finished season, collapsed, labelled by name. Dumping every played game on
    // a parent is the complaint Star Ems raised about the counters — the page
    // leading with information nobody came for. Collapse it and let them open the
    // record if they want it. The label names the season rather than saying a bare
    // "Season Complete", because once the club is flipped forward there can be
    // more than one of these stacked up and they have to be told apart.
    const seasonBar = (season, ds, open) => {
        const n = ds.reduce((sum, d) => sum + byDate[d].length, 0);
        return `<div class="archive season-done${open ? ' open' : ''}">
            <button class="archive-head" data-season="${esc(season)}">
                <span>${seasonIcon(season)} ${esc(season)} Season Complete · ${n} game${n === 1 ? '' : 's'} played</span>
                <span class="arch-chev">▶</span>
            </button>
            <div class="archive-body">${ds.map(block).join('')}</div>
        </div>`;
    };

    let html = upcoming.map(block).join('');

    // The club has been flipped to a season it has no games in yet. Rendering
    // nothing above the archive would read as a broken page, and the old season
    // must not quietly take its place at the top — the current season is the one
    // the club is in, empty or not.
    if (!current.length) {
        html += `<div class="state-msg">No ${esc(PRIMARY)} games posted.
                 <div class="state-sub">The schedule appears here as soon as it's released.</div></div>`;
    }

    if (played.length) {
        if (upcoming.length) {
            // Mid-season: what's left is above, what's done sits under a rule.
            html += `<div class="section-rule"><span>Already Played</span></div>`
                  + played.map(block).join('');
        } else {
            html += seasonBar(PRIMARY, played, DONE_OPEN);
        }
    }

    // Earlier seasons — one collapsed bar each, newest first. Ordered by their
    // latest game date, not by name: "Spring 2026" sorts before "Summer 2026"
    // only by accident, and that accident breaks at the turn of the year.
    const bySeason = {};
    older.forEach(d => { (bySeason[seasonOfDate(d)] = bySeason[seasonOfDate(d)] || []).push(d); });
    const archSeasons = Object.keys(bySeason).sort((a, b) =>
        bySeason[b].slice().sort().pop().localeCompare(bySeason[a].slice().sort().pop()));
    archSeasons.forEach(s => {
        html += seasonBar(s, bySeason[s].sort().reverse(), OPEN_SEASONS.has(s));
    });

    // Counts follow what's on screen: the current season, plus any archived season
    // the reader has opened. Locations are the exception — where a club plays is a
    // fact about the club, not about a season, so that number stays whole even
    // when the club is between seasons and every other count is zero.
    const shownDates = current.concat(archSeasons.filter(s => OPEN_SEASONS.has(s)).flatMap(s => bySeason[s]));
    updateInfoBar(rows.filter(g => shownDates.includes(g.date)), GAMES);

    host.innerHTML = html;

    host.querySelectorAll('.archive-head').forEach(btn => {
        btn.addEventListener('click', () => {
            const s = btn.dataset.season;
            if (s === PRIMARY) DONE_OPEN = !DONE_OPEN;
            else if (OPEN_SEASONS.has(s)) OPEN_SEASONS.delete(s);
            else OPEN_SEASONS.add(s);
            renderList();      // redraw so the counts at the top follow the panels
        });
    });
}

// ── Calendar view ────────────────────────────────────────────────────────────
let CAL_Y = 0, CAL_M = 0;          // month currently on screen
let CAL_SEL = null;                // the date whose day panel is open, if any
let OPEN_SEASONS = new Set();      // archived seasons expanded — survives re-renders
let DONE_OPEN = false;             // the current season's played list expanded

// The info bar describes WHAT IS ON SCREEN, not the club's lifetime totals.
// Star Ems caught this: the header said "Summer 2026 · Jul 1 – Aug 5" while the
// bar six inches below counted every game since May. Two numbers describing
// different things, side by side, reads as broken. So: current season by
// default, grows when the archive is opened, narrows when a filter is applied.
// `rows` is what's rendered; `allRows` is every game the club has. Teams, games
// and game days are facts about a SEASON and count only what's on screen — a club
// freshly flipped to Fall genuinely has none of them yet. Locations are a fact
// about the CLUB and keep counting the whole roster of fields, because where a
// club plays doesn't stop being true between seasons.
function updateInfoBar(rows, allRows) {
    const bar = document.getElementById('infoBar');
    if (!bar) return;
    const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
    const teams  = new Set(rows.flatMap(g => [g['Home Team'], g['Away Team']]).filter(Boolean));
    const days   = new Set(rows.map(g => g.date).filter(Boolean));
    const venues = new Set((allRows || rows).map(venueName));
    bar.innerHTML =
        `<span>${plural(teams.size, 'Team')}</span><span>${plural(rows.length, 'Game')}</span>` +
        `<span>${plural(days.size, 'Game Day')}</span><span>${plural(venues.size, 'Location')}</span>`;
}

// The season the calendar is showing: an explicit pick from the filter, else the
// one the club is in. The grid obeys the same trump card the list does — before
// this, a club flipped to Summer still opened on June and laid out spring games
// underneath a header that read "no games posted".
const calSeason = () => document.getElementById('seasonFilter').value || primarySeason(GAMES);

// Only that season's games reach the grid.
const calRows = () => { const s = calSeason(); return filtered().filter(g => seasonOf(g) === s); };

// Open inside the season, on a month that has something to show if one exists.
//
// Order matters. Games win first: the next one still to be played, else the last
// month that had one. Landing on today's month ahead of that would hide a real
// schedule — a club whose summer games all fell in July, read on August 20th,
// would open on a blank grid with three games sitting one click away.
//
// Only when the season is genuinely empty does the calendar sit on today, and
// then an empty August on a club flipped to Summer is the honest answer rather
// than falling back to June and contradicting the header.
function defaultCalMonth(season) {
    const now   = new Date();
    const span  = seasonMonths(season);
    const inS   = GAMES.filter(g => seasonOf(g) === season).map(g => g.date).filter(Boolean).sort();
    const monthOf = iso => { const d = new Date(iso + 'T12:00:00'); return [d.getFullYear(), d.getMonth()]; };

    if (inS.length) return monthOf(inS.find(d => d >= TODAY) || inS[inS.length - 1]);

    if (span) {
        const [y, m0, m1] = span;
        return (now.getFullYear() === y && now.getMonth() >= m0 && now.getMonth() <= m1)
            ? [y, now.getMonth()]
            : [y, m0];
    }
    return [now.getFullYear(), now.getMonth()];
}

function renderCal() {
    const season = calSeason();
    const span   = seasonMonths(season);
    const key    = (y, m) => y * 12 + m;

    // Changing the season picker leaves the grid parked in a month that season
    // doesn't contain. Snap back inside before drawing anything.
    if (span && (key(CAL_Y, CAL_M) < key(span[0], span[1]) || key(CAL_Y, CAL_M) > key(span[0], span[2])))
        [CAL_Y, CAL_M] = defaultCalMonth(season);

    const rows = calRows();
    const byDate = {};
    rows.forEach(g => { (byDate[g.date] = byDate[g.date] || []).push(g); });

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    document.getElementById('calTitle').textContent = `${MONTHS[CAL_M]} ${CAL_Y}`;

    // Navigation is fenced to the season on the grid. Paging out of a summer page
    // into an empty June is not useful now that the grid is season-scoped — the
    // season picker is the way to look at a finished season, and choosing one
    // re-fences the arrows around it.
    const prev = document.getElementById('calPrev'), next = document.getElementById('calNext');
    if (span) {
        prev.disabled = key(CAL_Y, CAL_M) <= key(span[0], span[1]);
        next.disabled = key(CAL_Y, CAL_M) >= key(span[0], span[2]);
    } else {
        const all = rows.map(g => g.date).filter(Boolean).sort();
        if (all.length) {
            const f = new Date(all[0] + 'T12:00:00'), l = new Date(all[all.length-1] + 'T12:00:00');
            prev.disabled = key(CAL_Y, CAL_M) <= key(f.getFullYear(), f.getMonth());
            next.disabled = key(CAL_Y, CAL_M) >= key(l.getFullYear(), l.getMonth());
        } else { prev.disabled = next.disabled = true; }
    }

    const first = new Date(CAL_Y, CAL_M, 1);
    const days  = new Date(CAL_Y, CAL_M + 1, 0).getDate();
    let html = ['S','M','T','W','T','F','S'].map(d => `<div class="cal-dow">${d}</div>`).join('');
    for (let i = 0; i < first.getDay(); i++) html += `<div class="cal-cell blank"></div>`;

    for (let d = 1; d <= days; d++) {
        const iso = `${CAL_Y}-${String(CAL_M+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const list = byDate[iso] || [];
        const cls = ['cal-cell'];
        if (iso === TODAY) cls.push('today');
        else if (iso < TODAY) cls.push('past');
        if (list.length) cls.push('has-games');

        let inner = `<div class="cal-daynum">${d}</div>`;
        // Desktop: up to two readable entries, then a "+N more".
        list.slice(0, 2).forEach(g => {
            const div = divisionLabel(g);
            inner += `<div class="cal-ev">${esc(fmtTime(g.time).replace(':00',''))}${div ? ' · ' + esc(div) : ''}</div>`;
        });
        if (list.length > 2) inner += `<div class="cal-more">+${list.length - 2} more</div>`;
        // Phone: dots only (see the media query).
        if (list.length) inner += `<div class="cal-dots">${list.map(() => '<span class="cal-dot"></span>').join('')}</div>`;

        html += `<div class="${cls.join(' ')}"${list.length ? ` data-date="${iso}"` : ''}>${inner}</div>`;
    }
    const grid = document.getElementById('calGrid');
    grid.innerHTML = html;

    // Tapping a day opens that day's games IN PLACE, under the grid. Jumping to
    // the list would throw away the calendar the parent is navigating by.
    grid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
        cell.addEventListener('click', () => openDay(cell.dataset.date));
    });

    // "Tap any highlighted day" is an instruction you can't follow on an empty
    // grid. Say what's actually true instead.
    document.getElementById('calLegend').textContent = rows.length
        ? 'Tap any highlighted day to see its games'
        : `No ${season} games posted.`;

    // Keep the open day open across a re-render (month nav, filter change), but
    // drop it if the current filters no longer leave anything on that date.
    if (CAL_SEL && byDate[CAL_SEL]) openDay(CAL_SEL, true); else closeDay();
}

function openDay(iso, keepScroll) {
    const rows = calRows().filter(g => g.date === iso);
    if (!rows.length) return closeDay();
    CAL_SEL = iso;

    document.querySelectorAll('.cal-cell').forEach(c =>
        c.classList.toggle('selected', c.dataset.date === iso));

    const isToday = iso === TODAY;
    document.getElementById('calDetail').innerHTML = `
        <div class="cal-detail-head">
            <h2>${esc(fmtDateHeading(iso))}${isToday ? ' <span class="today-pill">Today</span>' : ''}</h2>
            <span class="count">${rows.length} game${rows.length === 1 ? '' : 's'} · ${new Set(rows.map(venueName)).size} location${new Set(rows.map(venueName)).size === 1 ? '' : 's'}</span>
            <button class="cal-close" id="calClose" aria-label="Close">✕</button>
        </div>` + dayBlocksHTML(rows);

    document.getElementById('calClose').addEventListener('click', closeDay);
    if (!keepScroll) document.getElementById('calDetail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeDay() {
    CAL_SEL = null;
    document.getElementById('calDetail').innerHTML = '';
    document.querySelectorAll('.cal-cell.selected').forEach(c => c.classList.remove('selected'));
}

// Delegated once on document, so it survives every re-render — month paging,
// filter changes, opening a day panel. Binding per row would leak listeners and
// silently stop working after the first redraw.
document.addEventListener('click', e => {
    if (e.target.closest('.venue-link, .gb-map')) return;   // let map links through
    const row = e.target.closest('.game-row');
    if (!row) return;
    row.closest('.game-item').classList.toggle('open');
});

function setView(v) {
    document.querySelectorAll('.view-tab').forEach(b => b.classList.toggle('is-on', b.dataset.view === v));
    document.getElementById('calWrap').style.display = v === 'cal'  ? '' : 'none';
    document.getElementById('sched').style.display   = v === 'list' ? '' : 'none';
}

function wireViews(rows) {
    [CAL_Y, CAL_M] = defaultCalMonth(primarySeason(rows));
    document.querySelectorAll('.view-tab').forEach(b =>
        b.addEventListener('click', () => setView(b.dataset.view)));
    document.getElementById('calPrev').addEventListener('click', () => {
        if (--CAL_M < 0) { CAL_M = 11; CAL_Y--; } renderCal();
    });
    document.getElementById('calNext').addEventListener('click', () => {
        if (++CAL_M > 11) { CAL_M = 0; CAL_Y++; } renderCal();
    });
    document.getElementById('viewTabs').style.display = '';
}

function fillFilters() {
    // seasonOf(), not g.season — two East Haddam rows have the column blank and
    // fall back to their date, and they'd be missing from the picker otherwise.
    // The club's active season is folded in even when it holds no games yet: now
    // that the calendar is fenced to one season, this picker is the only way back
    // to a finished one, and a freshly flipped club would otherwise offer nothing.
    const seasons = [...new Set(GAMES.map(seasonOf).filter(Boolean)
                        .concat(ACTIVE_SEASON ? [ACTIVE_SEASON] : []))]
                    .sort((a, b) => seasonRank(b) - seasonRank(a));
    const put = (id, arr) => {
        const el = document.getElementById(id);
        arr.forEach(v => { const o = document.createElement('option'); o.value = v; o.textContent = v; el.appendChild(o); });
        el.addEventListener('change', render);
    };
    // Only offer a season picker when there is more than one to pick from.
    if (seasons.length > 1) { document.getElementById('seasonFilter').style.display = ''; put('seasonFilter', seasons); }
    put('divFilter',   [...new Set(GAMES.map(divisionLabel).filter(Boolean))].sort());
    put('teamFilter',  [...new Set(GAMES.flatMap(g => [g['Home Team'], g['Away Team']]).filter(Boolean))].sort());
    put('venueFilter', [...new Set(GAMES.map(venueName).filter(Boolean))].sort());
    document.getElementById('filterBar').style.display = '';
}

function fail(title, detail) {
    document.getElementById('sched').innerHTML = `<div class="state-msg"><strong>${esc(title)}</strong><br>${esc(detail)}</div>`;
    document.getElementById('subhead').textContent = '';
}

(async function init() {
    // A generated /<club>/schedule/ stub bakes the club in; the legacy
    // /schedules/club.html entry passes it on the query string. Both supported —
    // every ?club= link already handed to a club has to keep working.
    const slug = (window.CLUB_SLUG || '').trim()
              || new URLSearchParams(window.location.search).get('club') || '';
    if (!slug) { document.getElementById('clubName').textContent = 'Club Schedule';
        return fail('No club specified.', 'Add ?club= to the address, for example ?club=East Haddam'); }

    try {
        const sb = supabaseClient.client;

        // Resolve the club against the clubs table so a typo'd slug gives a clean
        // message instead of a convincing-looking empty schedule.
        const { data: clubs } = await sb.from('clubs')
            .select('id,name,"Club Name","Display Name",active_season');
        const match = (clubs || []).find(c =>
            norm(c.name) === norm(slug) || norm(c['Club Name']) === norm(slug));

        // TWO different names, and they are not interchangeable. `clubLabel` is the
        // KEY — games store their club as a name string, so this has to stay byte-
        // identical to what's in games."Source Club" or the schedule comes back
        // empty. `clubDisplay` is what the public reads. NECONN keys as "NECONN"
        // but is called "NECONN Soccer Club", and the Display Name column already
        // carries that, so no club needs hardcoding here.
        const clubLabel   = match ? (match['Club Name'] || match.name) : slug;
        const clubDisplay = match ? (match['Display Name'] || clubLabel) : slug;

        // The season flip in superadmin is what moves this page. Whatever the club
        // is set to is the season on top; everything else drops to the archive.
        ACTIVE_SEASON = match ? String(match.active_season || '').trim() : '';

        document.getElementById('clubName').textContent = clubDisplay;
        document.getElementById('footClub').textContent = clubDisplay + ' · ';
        document.title = clubDisplay + ' — Schedule';

        if (!match) return fail('That club was not found.', `Nothing in the system matches "${slug}".`);

        // Paginated. Supabase silently caps a request at 1000 rows — no error,
        // just a short array. See .claude-memory/FIXES_LOG.md, 2026-08-04.
        let games = [], from = 0;
        for (;;) {
            const { data, error } = await sb.from('games').select(SAFE_COLUMNS)
                .or(`"Source Club".eq.${clubLabel},club.eq.${clubLabel}`)
                .range(from, from + 999);
            if (error) throw error;
            if (!data || !data.length) break;
            games = games.concat(data);
            if (data.length < 1000) break;
            from += 1000;
        }

        // Venue names. Without this every block reads "Location TBD" — which is
        // exactly what shipped the first time, because this fetch was dropped
        // when club.html was split out of neconn.html.
        // `address` is not optional here — without it the block header shows only
        // the town and the Maps link loses the street. That shipped once already.
        const { data: vens, error: vErr } = await sb.from('venues').select('"Venue ID","Venue Name",address,city,state,zip');
        if (vErr) console.error('venues failed to load:', vErr.message);
        (vens || []).forEach(v => { VENUES[String(v['Venue ID'])] = v; });

        // A cancelled game is not a game a family should drive to.
        GAMES = games.filter(g => !/cancel/i.test(String(g.status || '') + String(g['Game Status'] || '')));
        GAMES.sort((a, b) => (a.date || '').localeCompare(b.date || '') || String(a.time || '').localeCompare(String(b.time || '')));

        if (!GAMES.length) return fail('No games posted yet.', 'Check back once the season schedule is released.');

        const dates    = GAMES.map(g => g.date).filter(Boolean).sort();
        const teams    = new Set(GAMES.flatMap(g => [g['Home Team'], g['Away Team']]).filter(Boolean));
        const venues   = new Set(GAMES.map(venueName));
        const upcoming = GAMES.filter(g => g.date >= TODAY).length;

        // Header describes the season the club is IN, not the whole year. "May 2
        // – Aug 5" spans two seasons and tells a parent nothing useful in August.
        const PRIMARY  = primarySeason(GAMES);
        const inSeason = GAMES.filter(g => seasonOf(g) === PRIMARY);
        const sDates   = inSeason.map(g => g.date).filter(Boolean).sort();
        const sLeft    = inSeason.filter(g => g.date >= TODAY).length;
        const icon     = seasonIcon(PRIMARY) || '❄️';

        // A club that has just been flipped to a new season has no games in it yet.
        // Saying "season complete" there would be a lie, and printing an empty date
        // range reads as a bug — say plainly that nothing is posted.
        document.getElementById('subhead').textContent = !sDates.length
            ? `${icon} ${PRIMARY} · no games posted`
            : `${icon} ${PRIMARY} · ` +
              fmtShort(sDates[0]) + ' – ' + fmtShort(sDates[sDates.length - 1]) +
              (sLeft ? ` · ${sLeft} game${sLeft === 1 ? '' : 's'} still to play` : ' · season complete');

        // Info bar is filled by renderList() — it follows what's on screen.
        document.getElementById('stamp').textContent =
            ' · Updated ' + new Date().toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
        document.getElementById('notesBox').style.display = '';

        fillFilters();
        wireViews(GAMES);
        render();
    } catch (e) {
        console.error(e);
        fail('The schedule could not be loaded right now.', 'Please refresh in a moment.');
    }
})();

})();
