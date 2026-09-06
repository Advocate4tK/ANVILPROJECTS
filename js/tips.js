/* ── RTTips ────────────────────────────────────────────────────────────────
   Clippy, done the way Clippy should have been done.

   Tod, 2026-09-06: "like Microsoft Word would have training balloons when
   people would first log in... with a cute little character."

   The complaint about Clippy was never the character. It was that he
   interrupted you mid-task, guessed wrong about what you wanted, and came back
   after you told him to go away. So the rules here are:

     · A tip shows ONCE per device, then never again unless it is reset.
     · Two exits: dismiss THIS tip, or turn off tips everywhere, for good.
     · It animates in once and then holds still. No idling, no pointing, no
       reappearing because someone navigated.
     · It NEVER throws. Every call is wrapped, storage is wrapped separately,
       and a failure degrades to no tip at all.

   That last rule is not theoretical: on 2026-09-06 a decorative banner with a
   bad quote killed the whole inline script on the availability form, taking the
   login gate with it, on the weekend before assignments went out. Nothing
   cosmetic gets to do that again.

   Usage — one line, anywhere:
       RTTips.show({
           id:    'avail-multi-game',      // unique; remembered per device
           title: 'You can take more than one game',
           html:  '<p>…</p>',              // trusted markup, authored here
           into:  document.querySelector('.form-container')   // optional
       });

   RTTips.off()   silence everything      RTTips.reset()  show them all again
   ?tips=reset in the URL also resets, which is how you demo them.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
    'use strict';

    const KEY_OFF  = 'rtTipsOff';
    const KEY_SEEN = id => 'rtTipSeen:' + id;

    const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
    const del = k => { try { localStorage.removeItem(k); } catch (e) {} };

    // The mascot IS the logo mark — the red and yellow cards, with a face. A
    // character that is already the brand earns recognition instead of spending
    // it, and it is SVG we own rather than an asset to load.
    const MASCOT =
          '<svg width="46" height="52" viewBox="0 0 46 52" style="flex-shrink:0;" aria-hidden="true">'
        + '<rect x="3" y="6" width="24" height="34" rx="4" fill="#f5c518" transform="rotate(-12 15 23)"/>'
        + '<rect x="16" y="10" width="24" height="34" rx="4" fill="#e94560" transform="rotate(9 28 27)"/>'
        + '<circle cx="24" cy="24" r="3.1" fill="#fff"/><circle cx="34" cy="26" r="3.1" fill="#fff"/>'
        + '<circle cx="24.8" cy="24.6" r="1.5" fill="#09142a"/><circle cx="34.8" cy="26.6" r="1.5" fill="#09142a"/>'
        + '<path d="M25 33 q5 4 10 1" stroke="#09142a" stroke-width="2" fill="none" stroke-linecap="round"/>'
        + '</svg>';

    function build(opts) {
        const tip = document.createElement('div');
        tip.className = 'rt-tip';
        tip.style.cssText =
              'position:relative;background:linear-gradient(135deg,#e8f8ef,#d7f0e3);'
            + 'border:2px solid #1e8449;border-radius:12px;padding:16px 44px 16px 20px;'
            + 'margin:0 0 22px;color:#09142a;box-shadow:0 2px 10px rgba(30,132,73,0.18);';
        tip.innerHTML =
              '<button type="button" data-rt="close" aria-label="Dismiss" '
            + 'style="position:absolute;top:8px;right:10px;background:none;border:none;'
            + 'font-size:1.4rem;line-height:1;color:#1e8449;cursor:pointer;padding:2px 6px;">&times;</button>'
            + '<div style="display:flex;gap:14px;align-items:flex-start;">' + MASCOT + '<div>'
            + '<div style="font-family:Barlow Condensed,sans-serif;font-weight:800;font-size:1.15rem;'
            + 'letter-spacing:1px;text-transform:uppercase;color:#1e8449;margin-bottom:6px;">'
            + (opts.title || '') + '</div>'
            + '<div style="font-size:0.95rem;line-height:1.5;">' + (opts.html || '') + '</div>'
            + '<button type="button" data-rt="off" style="margin-top:10px;background:none;border:none;'
            + 'padding:0;font-size:0.8rem;color:#1e8449;text-decoration:underline;cursor:pointer;">'
            + 'Turn off tips like this</button>'
            + '</div></div>';
        return tip;
    }

    const RTTips = {
        show(opts) {
            try {
                if (!opts || !opts.id) return false;
                if (get(KEY_OFF) === '1') return false;
                if (get(KEY_SEEN(opts.id)) === '1') return false;

                const host = opts.into || document.querySelector('.form-container') || document.body;
                if (!host) return false;

                const tip = build(opts);
                host.insertBefore(tip, host.firstChild);

                // One arrival, then still.
                try {
                    tip.animate(
                        [{ transform: 'translateY(-8px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
                        { duration: 260, easing: 'ease-out' });
                } catch (e) {}

                tip.querySelector('[data-rt="close"]').addEventListener('click', () => {
                    tip.remove(); set(KEY_SEEN(opts.id), '1');
                });
                tip.querySelector('[data-rt="off"]').addEventListener('click', () => {
                    tip.remove(); set(KEY_OFF, '1');
                });
                return true;
            } catch (e) {
                console.warn('RTTips.show skipped', e);
                return false;
            }
        },

        off()  { set(KEY_OFF, '1'); },
        on()   { del(KEY_OFF); },

        // Forget every tip on this device. Used by ?tips=reset so tips can be
        // demonstrated without clearing site data by hand.
        reset() {
            try {
                del(KEY_OFF);
                Object.keys(localStorage)
                    .filter(k => k.indexOf('rtTipSeen:') === 0)
                    .forEach(del);
            } catch (e) {}
        }
    };

    try {
        if (new URLSearchParams(location.search).get('tips') === 'reset') RTTips.reset();
    } catch (e) {}

    window.RTTips = RTTips;
})();
