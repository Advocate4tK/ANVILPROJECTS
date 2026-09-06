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

    var queue = [], idx = 0, el = null, veil = null;

    function close(markRest) {
        if (markRest) {
            queue.slice(idx).forEach(function (t) { set(KEY_SEEN(t.id), '1'); });
        }
        if (el)   { el.remove();   el = null; }
        if (veil) { veil.remove(); veil = null; }
        queue = []; idx = 0;
    }

    function render() {
        var t = queue[idx];
        if (!t) { close(false); return; }
        set(KEY_SEEN(t.id), '1');           // seen the moment it is shown

        var more = idx < queue.length - 1;
        var step = queue.length > 1
            ? '<span style="color:#7a8ba0;font-size:0.74rem;">' + (idx + 1) + ' of ' + queue.length + '</span>'
            : '';

        el.innerHTML =
              '<button type="button" data-rt="close" aria-label="Close" '
            + 'style="position:absolute;top:6px;right:8px;background:none;border:none;font-size:1.5rem;'
            + 'line-height:1;color:#1e8449;cursor:pointer;padding:2px 7px;">&times;</button>'
            + '<div style="display:flex;gap:14px;align-items:flex-start;">' + MASCOT + '<div style="min-width:0;">'
            + '<div style="font-family:Barlow Condensed,sans-serif;font-weight:800;font-size:1.12rem;'
            + 'letter-spacing:1px;text-transform:uppercase;color:#1e8449;margin-bottom:5px;padding-right:18px;">'
            + (t.title || '') + '</div>'
            + '<div style="font-size:0.92rem;line-height:1.5;">' + (t.html || '') + '</div>'
            + '<div style="display:flex;align-items:center;gap:12px;margin-top:12px;flex-wrap:wrap;">'
            + (more
                ? '<button type="button" data-rt="next" style="background:#1e8449;color:#fff;border:none;'
                  + 'border-radius:7px;padding:6px 14px;font-weight:800;font-size:0.82rem;cursor:pointer;">'
                  + 'Next tip &rarr;</button>'
                : '<button type="button" data-rt="close" style="background:#1e8449;color:#fff;border:none;'
                  + 'border-radius:7px;padding:6px 14px;font-weight:800;font-size:0.82rem;cursor:pointer;">'
                  + 'Got it</button>')
            + step
            + '<button type="button" data-rt="off" style="margin-left:auto;background:none;border:none;padding:0;'
            + 'font-size:0.76rem;color:#5a7a66;text-decoration:underline;cursor:pointer;">Turn off tips</button>'
            + '</div></div></div>';

        el.querySelectorAll('[data-rt="close"]').forEach(function (b) {
            b.addEventListener('click', function () { close(true); });
        });
        var nx = el.querySelector('[data-rt="next"]');
        if (nx) nx.addEventListener('click', function () { idx++; render(); });
        el.querySelector('[data-rt="off"]').addEventListener('click', function () {
            set(KEY_OFF, '1'); close(false);
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
        veil.addEventListener('click', function () { close(true); });
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
                if (get(KEY_OFF) === '1') return false;
                if (get(KEY_SEEN(opts.id)) === '1') return false;
                for (var i = 0; i < queue.length; i++) { if (queue[i].id === opts.id) return false; }

                queue.push(opts);
                mount();
                // First one paints immediately; later arrivals extend the run and
                // are picked up when Next is pressed.
                if (queue.length === 1) render();
                return true;
            } catch (e) { console.warn('RTTips.show skipped', e); return false; }
        },

        off: function () { try { set(KEY_OFF, '1'); close(false); } catch (e) {} },
        on:  function () { del(KEY_OFF); },

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
