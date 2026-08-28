/**
 * Workstation tabs — Clubs · Events · Tournaments
 *
 * Moving between the three workstations used to mean: Back to Dashboard, then the
 * chooser, then the workstation. Three page loads to get between two screens an
 * assignor uses all day. This puts that same three-way choice inside every
 * workstation instead of only at the front door.
 *
 * ONE file on purpose. assignor-workstation.html and event-assignor-workstation.html
 * are near-identical 8,000-line twins that have already drifted apart once; pasting
 * a tab strip into both would make it a third thing to keep in sync. Both pages load
 * this and get the same strip.
 *
 * Availability rule (Tod, 2026-08-03): a tab is live if you have EVER had one of
 * that kind — not "active this week". The strip must never change shape underneath
 * someone. Greyed means genuinely none, ever.
 *
 * ⚠️ FAILS OPEN. If a lookup errors we light the tab up rather than grey it out.
 * Greying a tab an assignor actually needs would hide their work with no
 * explanation — the same failure that hid every East Haddam game for a week.
 */
(function () {
    'use strict';

    const PAGES = {
        clubs:       'assignor-workstation.html',
        events:      'event-assignor-workstation.html',
        tournaments: 'tournament.html'
    };

    function styleOnce() {
        if (document.getElementById('wsTabsStyle')) return;
        const s = document.createElement('style');
        s.id = 'wsTabsStyle';
        s.textContent = `
            #wsTabs {
                display: flex; gap: 6px; align-items: stretch;
                margin: 0 0 14px; flex-wrap: wrap;
            }
            .ws-tab {
                display: inline-flex; align-items: center; gap: 8px;
                font-family: 'Barlow Condensed', sans-serif;
                font-size: 1.02rem; font-weight: 700; letter-spacing: 0.4px;
                text-transform: uppercase; text-decoration: none;
                padding: 9px 20px; border-radius: 8px 8px 0 0;
                background: #dfe5ee; color: #4a5a72;
                border: 1px solid #c9d3e0; border-bottom: none;
                transition: background 0.15s, color 0.15s, transform 0.15s;
            }
            .ws-tab:hover { background: #eef2f8; color: #0f3460; transform: translateY(-1px); }
            .ws-tab .ws-count {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.72rem; font-weight: 700;
                background: rgba(15,52,96,0.12); color: #0f3460;
                border-radius: 10px; padding: 1px 7px;
            }
            /* The one you're standing in — green edge, same signature as the rest of the tool */
            .ws-tab.is-current {
                background: #0f3460; color: #ffffff;
                border-color: #0f3460; cursor: default;
                border-top: 3px solid #00c853; padding-top: 7px;
            }
            .ws-tab.is-current:hover { transform: none; background: #0f3460; }
            .ws-tab.is-current .ws-count { background: rgba(255,255,255,0.18); color: #ffffff; }
            /* Never had one of these. Not a failure state — just nothing behind the door. */
            .ws-tab.is-empty {
                opacity: 0.45; cursor: not-allowed; pointer-events: none;
                background: #e8ebf0; color: #8a96a8;
            }
            @media (max-width: 560px) {
                .ws-tab { font-size: 0.9rem; padding: 8px 13px; }
                .ws-tab .ws-count { display: none; }
            }

            /* Compact mode hides the strip outright, same as #topButtonBar.
               First attempt only shrank it — the reasoning being that navigation should
               survive collapsing. Tod's answer, looking at it on a real assigning
               screen: even compressed it is still a whole row, and in compact every
               row belongs to the games grid. Expand brings it back. */
            #wsTabs.is-compact { display: none !important; }
        `;
        document.head.appendChild(s);
    }

    function tabHtml(key, label, count, current, available) {
        const isCurrent = key === current;
        const isEmpty   = !available && !isCurrent;
        const cls = 'ws-tab' + (isCurrent ? ' is-current' : '') + (isEmpty ? ' is-empty' : '');
        const badge = (count === null || count === undefined)
            ? ''
            : `<span class="ws-count">${count}</span>`;
        const title = isEmpty
            ? `No ${label.toLowerCase()} assigned to you`
            : (isCurrent ? `You are here` : `Switch to ${label}`);
        // The current tab is a span, not a link — clicking the page you're on is a
        // page reload that loses whatever you had loaded.
        return isCurrent
            ? `<span class="${cls}" title="${title}">${label}${badge}</span>`
            : `<a class="${cls}" href="${PAGES[key]}" title="${title}">${label}${badge}</a>`;
    }

    /**
     * Mirror the header's compact state onto the tab strip.
     *
     * Compact mode toggles `header-collapsed` on <header> and hides #topButtonBar
     * outright. The tabs sit outside that bar (deliberately — they're navigation and
     * should survive collapsing), so they'd otherwise stay full-size while everything
     * around them shrank. Watching the header rather than editing toggleHeaderCompact()
     * keeps this entirely inside the shared file: neither 8,000-line twin has to know
     * the tabs exist.
     */
    function followCompact(host) {
        const hdr = document.querySelector('header');
        if (!hdr) return;
        const sync = () => host.classList.toggle('is-compact', hdr.classList.contains('header-collapsed'));
        sync();                                   // compact may already be restored from localStorage
        if (host._compactWatcher) host._compactWatcher.disconnect();
        host._compactWatcher = new MutationObserver(sync);
        host._compactWatcher.observe(hdr, { attributes: true, attributeFilter: ['class'] });
    }

    /**
     * @param {'clubs'|'events'|'tournaments'} current  which workstation is showing
     * @param {object} assignor  the chosen profile — needs {role, clubs, name, email}
     */
    window.renderWorkstationTabs = async function (current, assignor) {
        try {
            styleOnce();

            const anchor = document.getElementById('topButtonBar');
            if (!anchor) return;

            let host = document.getElementById('wsTabs');
            if (!host) {
                host = document.createElement('div');
                host.id = 'wsTabs';
                anchor.parentNode.insertBefore(host, anchor.nextSibling);
            }

            const isAdmin = (assignor && (assignor.role || '').trim() === 'Admin');
            const scope   = (assignor && Array.isArray(assignor.clubs)) ? assignor.clubs : [];

            // Which of the names in an assignor's scope are EVENTS rather than clubs?
            // The `clubs` array holds both, mixed — Tod's reads
            // ["East Haddam","Griswold","NECONN","Ellis Tech Summer League","Girls Summer League"].
            //
            // TWO sets, and the split is the whole point. Identity ("is this name an event?")
            // must see EVERY event; liveness ("is it running?") sees only enabled ones. Filter
            // the identity set and a switched-off event stops being recognised as an event —
            // it then falls into `myClubs` and inflates the Clubs badge with dead seasons.
            // Exactly how Girls Summer League ended up rendering as a club pill in the club
            // workstation, from the same one-list-two-jobs mistake.
            let allEventNames = [], liveEventNames = [];
            try {
                const { data } = await supabaseClient.client
                    .from('events').select('"Club Name", enabled');
                allEventNames  = (data || []).map(e => e['Club Name']).filter(Boolean);
                liveEventNames = (data || []).filter(e => e.enabled).map(e => e['Club Name']).filter(Boolean);
            } catch (e) { /* fail open below */ }

            const evSet     = new Set(allEventNames);    // identity
            const liveEvSet = new Set(liveEventNames);   // liveness
            const myEvents  = scope.filter(n => liveEvSet.has(n));
            const myClubs   = scope.filter(n => !evSet.has(n));
            // "Ever had one of these", per the availability rule above — an assignor who ran a
            // season keeps the tab, it just reads 0. The strip never changes shape underneath them.
            const everHadEvents = scope.some(n => evSet.has(n));

            // Tournaments carry their own assignor (name + email); there is no
            // per-assignor tournament scoping in the clubs array.
            let myTourns = 0;
            try {
                const { data } = await supabaseClient.client
                    .from('tournaments').select('assignor, assignor_email');
                const rows = data || [];
                if (isAdmin) {
                    myTourns = rows.length;
                } else {
                    const nm = (assignor && assignor.name  || '').trim().toLowerCase();
                    const em = (assignor && assignor.email || '').trim().toLowerCase();
                    myTourns = rows.filter(t =>
                        (nm && (t.assignor || '').trim().toLowerCase() === nm) ||
                        (em && (t.assignor_email || '').trim().toLowerCase() === em)
                    ).length;
                }
            } catch (e) {
                myTourns = null;   // unknown → treated as available, never greyed
            }

            const counts = {
                clubs:       isAdmin ? null : myClubs.length,
                events:      isAdmin ? null : myEvents.length,
                tournaments: myTourns
            };
            const available = {
                clubs:       isAdmin || myClubs.length  > 0,
                events:      isAdmin || everHadEvents,   // ever, not now — see the rule at the top
                tournaments: isAdmin || myTourns === null || myTourns > 0
            };

            host.innerHTML =
                tabHtml('clubs',       'Clubs',       counts.clubs,       current, available.clubs) +
                tabHtml('events',      'Events',      counts.events,      current, available.events) +
                tabHtml('tournaments', 'Tournaments', counts.tournaments, current, available.tournaments);

            followCompact(host);
        } catch (err) {
            // A broken tab strip must never take a workstation down with it.
            console.warn('workstation tabs failed to render:', err);
        }
    };
})();
