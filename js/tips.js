/* -- RTTips ----------------------------------------------------------------
   Clippy, done the way Clippy should have been done.

   Tod, 2026-09-06: "clippy pops up in the middle of the page sometimes and you
   have to 'x' him or 'next tip'."

   So he FLOATS. He is not a notice in the page flow - he sits on top of it,
   bottom-right on a desktop and across the bottom on a phone, and you deal with
   him: Next tip, or the x.

   What made Clippy hated was never the character. It was that he interrupted
   mid-task, guessed wrong, and came back after being told to go. The rules:

     - Each tip shows ONCE per device. Seen is seen.
     - Three exits: Next tip, the x (closes the whole run), and "Turn off tips",
       which silences every tip on every page for good.
     - He arrives once and holds still. No idling animation, no pointing at
       things while you type, no reappearing on navigation.
     - He NEVER throws. Every entry point and every storage access is wrapped;
       a failure means no tip, never a broken page.

   That last rule is not theoretical. On 2026-09-06 a decorative banner with one
   bad quote killed the entire inline script on the availability form - taking
   the login gate with it - on the weekend before assignments went out. Nothing
   cosmetic gets to do that again.

   Usage. Queue as many as you like; they present in order:

       RTTips.show({ id: 'avail-multi-game',
                     title: 'You can take more than one game',
                     html:  '<p>...</p>' });

   RTTips.off()  silence everything    RTTips.reset()  show them all again
   ?tips=reset in the URL also resets, which is how you demo him.
   -------------------------------------------------------------------------- */
(function () {
    'use strict';

    // ⚠️ NOTHING PERSISTS. Tod, 2026-09-06: "turn off tips only turns it off this
    // time... will get tips again when they log in next time."
    //
    // So there is no off switch that outlives the visit. Every referee sees the
    // run every time they open the page, and "for now" only quiets him until the
    // next load. That is deliberate: referees come back a few times a season, the
    // thing this explains cost a weekend of support calls, and a permanent mute
    // pressed at tip three would silence it for exactly the people who need tip
    // five.
    //
    // TWO exits, because they are different requests:
    //   "Turn off tips for now"  quiets him for THIS visit; nothing is written,
    //                            so he is back on the next load
    //   "Never show tips again"  written down and honoured forever
    // The default is repetition; permanence is a deliberate choice a referee has
    // to make, not something they fall into by pressing the nearest button.
    var KEY_OFF = 'rtTipsOff';
    function KEY_SEEN(id) { return 'rtTipSeen:' + id; }

    function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function del(k) { try { localStorage.removeItem(k); } catch (e) {} }

    // The mascot IS the logo mark - the red and yellow cards, with a face. A
    // character that is already the brand earns recognition rather than spending
    // it, and it is SVG we own rather than an asset to load.
    var MASCOT =
          '<svg width="62" height="70" viewBox="0 0 46 52" style="flex-shrink:0;" aria-hidden="true">'
        + '<rect x="3" y="6" width="24" height="34" rx="4" fill="#f5c518" transform="rotate(-12 15 23)"/>'
        + '<rect x="16" y="10" width="24" height="34" rx="4" fill="#e94560" transform="rotate(9 28 27)"/>'
        + '<circle cx="24" cy="24" r="3.6" fill="#fff"/><circle cx="34.5" cy="26" r="3.6" fill="#fff"/>'
        + '<circle cx="25" cy="24.7" r="1.8" fill="#09142a"/><circle cx="35.5" cy="26.7" r="1.8" fill="#09142a"/>'
        + '<path d="M25 33.5 q5.5 4.5 11 1" stroke="#09142a" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
        + '</svg>';

    var queue = [], idx = 0, el = null, veil = null, again = null, done = false;

    // How long he waits before coming back after an x. Tod, 2026-09-06: "I almost
    // want the thing to be annoying." Long enough not to fight a tap, short
    // enough that skipping is not a way out.
    var NAG_MS = 15000;

    // ⚠️ TIPS REPEAT EVERY VISIT. Tod, 2026-09-06: "I want it to show up every
    // time." Once-per-device was the safe default and it was wrong for this job —
    // referees do not visit often enough to learn from a thing they saw once in
    // August, and the misunderstanding it fixes cost a whole weekend of support.
    //
    // "Turn off tips" is therefore the ONLY thing that persists. It is the
    // referee's own decision and it is honoured forever; nothing else is
    // remembered, so seen-ness never silently swallows the message.
    // The x means NOT NOW, not never. He comes back in the same session, at the
    // tip you were on, until you either read the run to the end or press
    // "Turn off tips" — which is the real door and is honoured forever.
    //
    // The run also survives being closed: `queue` and `idx` are kept, so he
    // resumes rather than restarting and making you re-read tip one.
    function hide() {
        if (el)   { el.remove();   el = null; }
        if (veil) { veil.remove(); veil = null; }
    }

    function dismiss() {
        hide();
        if (done) return;
        clearTimeout(again);
        again = setTimeout(function () { if (!done && queue.length) { mount(); render(); } }, NAG_MS);
    }

    function finish() {
        done = true;
        clearTimeout(again);
        hide();
        queue = []; idx = 0;
    }

    function render() {
        var t = queue[idx];
        if (!t) { finish(); return; }

        var more = idx < queue.length - 1;
        var step = queue.length > 1
            ? '<span style="color:#7a8ba0;font-size:0.74rem;">' + (idx + 1) + ' of ' + queue.length + '</span>'
            : '';

        el.innerHTML =
              '<button type="button" data-rt="close" aria-label="Close" '
            + 'style="position:absolute;top:6px;right:8px;background:none;border:none;font-size:1.5rem;'
            + 'line-height:1;color:#1e8449;cursor:pointer;padding:2px 7px;" '
            + 'title="Hide for now — it will come back">&times;</button>'
            + '<div style="display:flex;gap:14px;align-items:flex-start;">' + MASCOT + '<div style="min-width:0;">'
            + '<div style="font-family:Barlow Condensed,sans-serif;font-weight:800;font-size:1.12rem;'
            + 'letter-spacing:1px;text-transform:uppercase;color:#1e8449;margin-bottom:5px;padding-right:18px;">'
            + (t.title || '') + '</div>'
            + '<div style="font-size:0.92rem;line-height:1.5;">' + (t.html || '') + '</div>'
            + '<div style="display:flex;align-items:center;gap:12px;margin-top:12px;flex-wrap:wrap;">'
            // One primary button that always moves you forward: "Got it" steps to
            // the next tip and finishes on the last. Two different labels for the
            // same green button taught people to read it before pressing it.
            + '<button type="button" data-rt="' + (more ? 'next' : 'finish') + '" '
            + 'style="background:#1e8449;color:#fff;border:none;border-radius:7px;padding:7px 16px;'
            + 'font-weight:800;font-size:0.84rem;cursor:pointer;">'
            + (more ? 'Got it &rarr;' : 'Got it') + '</button>'
            + step
            + '<span style="margin-left:auto;display:flex;gap:10px;align-items:center;">'
            + '<button type="button" data-rt="off" style="background:none;border:none;padding:0;'
            + 'font-size:0.76rem;color:#5a7a66;text-decoration:underline;cursor:pointer;" '
            + 'title="Quiet for this visit — back next time">Not now</button>'
            + '<button type="button" data-rt="never" style="background:none;border:none;padding:0;'
            + 'font-size:0.76rem;color:#8a9aa3;text-decoration:underline;cursor:pointer;" '
            + 'title="Never show tips on this device again">Never show tips</button>'
            + '</span>'
            + '</div></div></div>';

        el.querySelectorAll('[data-rt="close"]').forEach(function (b) {
            b.addEventListener('click', function () { dismiss(); });
        });
        el.querySelectorAll('[data-rt="finish"]').forEach(function (b) {
            b.addEventListener('click', function () { finish(); });
        });
        var nx = el.querySelector('[data-rt="next"]');
        if (nx) nx.addEventListener('click', function () { idx++; render(); });
        // Quiets him for THIS visit only. Nothing is written down, so he is back
        // on the next page load — which is the whole point.
        el.querySelector('[data-rt="off"]').addEventListener('click', function () { finish(); });
        // The permanent door. Deliberately the quieter of the two, and it asks —
        // a referee who taps it by accident and then never hears about a change
        // to the form is worse off than one who saw a tip twice.
        el.querySelector('[data-rt="never"]').addEventListener('click', function () {
            var ok = true;
            try { ok = confirm('Stop showing tips on this device? You can bring them back by adding ?tips=reset to the address.'); } catch (e) {}
            if (!ok) return;
            set(KEY_OFF, '1');
            finish();
        });
    }

    function mount() {
        if (el) return;
        el = document.createElement('div');
        el.className = 'rt-tip-pop';
        // DEAD CENTRE, OVER A DIMMED PAGE. Tod: "I literally want it to be in
        // their faces." Referees were submitting once per game all weekend and a
        // polite corner toast is exactly what they scrolled past.
        //
        // The veil dims but does not imprison: clicking it closes, and there is
        // no focus trap. Every exit still works. A tutorial that a referee cannot
        // escape two days before assignments would be a far worse sin than being
        // annoying.
        veil = document.createElement('div');
        veil.style.cssText =
              'position:fixed;inset:0;z-index:99998;background:rgba(9,20,42,0.55);'
            + 'backdrop-filter:blur(1.5px);';
        veil.addEventListener('click', function () { dismiss(); });
        document.body.appendChild(veil);

        el.style.cssText =
              'position:fixed;z-index:99999;left:50%;top:50%;transform:translate(-50%,-50%);'
            + 'width:min(470px,calc(100vw - 28px));'
            + 'background:linear-gradient(135deg,#f2fdf7,#dcf1e5);border:3px solid #1e8449;'
            + 'border-radius:16px;padding:20px 24px;color:#09142a;'
            + 'box-shadow:0 24px 60px rgba(0,0,0,0.45);font-family:inherit;';
        document.body.appendChild(el);
        try {
            // Keeps the centring offsets, or he leaps across the screen as he lands.
            el.animate([{ transform: 'translate(-50%,-50%) scale(.9)', opacity: 0 },
                        { transform: 'translate(-50%,-50%) scale(1)',  opacity: 1 }],
                       { duration: 260, easing: 'cubic-bezier(.2,1.1,.3,1)' });
            veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
        } catch (e) {}
    }

    var RTTips = {
        show: function (opts) {
            try {
                if (!opts || !opts.id) return false;
                // ⚠️ THE RUN IS OVER FOR THIS VISIT. Without this, "Not now" was
                // useless on the openings board: that page repaints on every
                // filter change and on its 60-second refresh, and each repaint
                // called show() again and brought Tippy straight back.
                if (done) return false;
                if (get(KEY_OFF) === '1') return false;      // "never again", honoured
                for (var i = 0; i < queue.length; i++) { if (queue[i].id === opts.id) return false; }

                queue.push(opts);
                mount();
                // ⚠️ RE-RENDER ON EVERY ADD. Pages queue their whole run in one
                // synchronous burst, so the first call used to paint a lone tip
                // reading "Got it" — which CLOSED — and tips 2..n never appeared
                // at all. Re-painting keeps the "1 of 4" counter and the forward
                // button honest as the run is assembled.
                render();
                return true;
            } catch (e) { console.warn('RTTips.show skipped', e); return false; }
        },

        off:   function () { try { finish(); } catch (e) {} },          // this visit
        never: function () { try { set(KEY_OFF, '1'); finish(); } catch (e) {} },

        // Kept for the ?tips=reset URL and for clearing anything an earlier
        // build wrote. There is nothing to reset in normal use any more.
        reset: function () {
            try {
                del(KEY_OFF);
                Object.keys(localStorage)
                    .filter(function (k) { return k.indexOf('rtTipSeen:') === 0; })
                    .forEach(del);
            } catch (e) {}
        }
    };

    try {
        if (new URLSearchParams(location.search).get('tips') === 'reset') RTTips.reset();
    } catch (e) {}

    window.RTTips = RTTips;
})();
