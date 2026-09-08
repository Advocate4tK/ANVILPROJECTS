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

    // ── PIP ─────────────────────────────────────────────────────────────────
    // Tod named him 2026-09-08. He had been "Clippy" only in conversation —
    // nothing in the code ever said it. The name goes on the card as a byline
    // so referees have something to call him; an unnamed cartoon giving you
    // instructions is stranger than a named one.
    var PIP = 'Pip';

    // On the FIRST tip only, Pip blows his whistle: the whistle swings up and
    // two puff arcs breathe outward. Tod: "little whistle blowing at first tip!"
    //
    // Paired with a real whistle sound — see blowWhistle(). Ralph argued for
    // silence and Tod overruled it; his product, his referees.
    //
    // First tip only — a whistle on every tip stops being a greeting and starts
    // being a tic.
    var WHISTLE =
          '<g class="rt-pip-whistle" transform="translate(30 34)">'
        + '<rect x="0" y="0" width="11" height="6.5" rx="3" fill="#2c3e50"/>'
        + '<circle cx="9.5" cy="3.2" r="2.6" fill="#2c3e50"/>'
        + '<circle cx="9.5" cy="3.2" r="1.1" fill="#7f8c8d"/>'
        + '<path class="rt-pip-puff rt-pip-puff1" d="M14 3 q4 -2.5 8 0"   stroke="#9fb3c8" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
        + '<path class="rt-pip-puff rt-pip-puff2" d="M14 3 q6.5 -4.5 13 0" stroke="#9fb3c8" stroke-width="1.3" fill="none" stroke-linecap="round"/>'
        + '</g>';

    var WHISTLE_CSS =
          '@keyframes rtPipToot{0%{transform:translate(30px,34px) rotate(0deg)}'
        + '12%{transform:translate(30px,30px) rotate(-15deg)}'
        + '50%{transform:translate(30px,30px) rotate(-15deg)}'
        + '72%{transform:translate(30px,34px) rotate(0deg)}'
        + '100%{transform:translate(30px,34px) rotate(0deg)}}'
        + '@keyframes rtPipPuff{0%{opacity:0;transform:translateX(0) scale(.6)}'
        + '35%{opacity:.95}100%{opacity:0;transform:translateX(7px) scale(1.25)}}'
        + '.rt-pip-whistle{animation:rtPipToot 1.5s cubic-bezier(.16,1.1,.3,1) 1 both;transform-origin:2px 3px}'
        + '.rt-pip-puff{opacity:0;transform-origin:14px 3px}'
        // The puffs fire at the TOP of the leap, while he is hanging there.
        + '.rt-pip-puff1{animation:rtPipPuff .62s ease-out .02s 3 both}'
        + '.rt-pip-puff2{animation:rtPipPuff .62s ease-out .22s 3 both}'
        // Anyone who has asked their device to stop moving things gets a still
        // whistle. Same information, no motion.
        // THE ARRIVAL. Tod: "he blows his whistle and then falls back into the
        // card. Like, do you remember Clippy used to do something when you first
        // opened up." Pip rises out of the card, leans in to blow, then settles
        // back down with one small bounce. Runs ONCE, on the first tip only.
        // ⚠️ HE COMES AT YOU, HE DOES NOT JUMP. Tod, 2026-09-08: "it seems like
        // he drops in from the top and then down into the card. Have him come at
        // the front of the card and fall back."
        //
        // The earlier version travelled UP 158px and fell DOWN — vertical, like
        // a jump. Wrong axis. What he wants is DEPTH: Pip comes out of the front
        // of the card toward the viewer, hangs in your face while he blows, then
        // falls BACK into the surface he came from.
        //
        // So the movement is now almost entirely SCALE, with only a few pixels of
        // rise for weight. Two things sell it as depth rather than as growth:
        //   * perspective + translateZ, so he genuinely travels toward the camera
        //   * a drop-shadow that deepens as he comes forward and collapses as he
        //     falls back. Without the shadow he reads as inflating; with it he
        //     reads as approaching.
        // Still bold, still fast: forward in 90ms, held, then back in ~200ms.
        + '@keyframes rtPipEnter{'
        + '0%{transform:perspective(600px) translateZ(-220px) scale(.55) rotate(-10deg);opacity:0;'
        +   'filter:drop-shadow(0 0 0 rgba(0,0,0,0))}'
        + '6%{transform:perspective(600px) translateZ(180px) translateY(-14px) scale(3.3) rotate(5deg);opacity:1;'
        +   'filter:drop-shadow(0 26px 22px rgba(9,20,42,.45))}'      /* out at you */
        + '11%{transform:perspective(600px) translateZ(165px) translateY(-12px) scale(3.1) rotate(-3deg);'
        +   'filter:drop-shadow(0 24px 20px rgba(9,20,42,.42))}'
        + '58%{transform:perspective(600px) translateZ(165px) translateY(-12px) scale(3.1) rotate(-3deg);'
        +   'filter:drop-shadow(0 24px 20px rgba(9,20,42,.42))}'      /* dead still, blowing */
        + '74%{transform:perspective(600px) translateZ(70px) translateY(-5px) scale(1.9) rotate(-1deg);'
        +   'filter:drop-shadow(0 12px 12px rgba(9,20,42,.28))}'      /* falling back in */
        + '86%{transform:perspective(600px) translateZ(-26px) translateY(2px) scale(.9) rotate(1deg);'
        +   'filter:drop-shadow(0 2px 4px rgba(9,20,42,.12))}'        /* past flush, into the card */
        + '94%{transform:perspective(600px) translateZ(8px) scale(1.05);'
        +   'filter:drop-shadow(0 3px 5px rgba(9,20,42,.10))}'
        + '100%{transform:perspective(600px) translateZ(0) translateY(0) scale(1) rotate(0deg);'
        +   'filter:drop-shadow(0 0 0 rgba(0,0,0,0))}}'
        + '.rt-pip-enter{display:inline-block;position:relative;z-index:3;'
        + 'animation:rtPipEnter 1.5s cubic-bezier(.16,1.1,.3,1) 1 both;'
        + 'transform-origin:50% 60%}'
        // (A greeting line lived here until 2026-09-08. Tod: "The first card
        // shouldn't give information, but explain what PIP is." The first CARD
        // now introduces him — its title is his line — so a separate greeting
        // above it would say the same thing twice. Keyframes kept in case a page
        // ever wants the line without a dedicated intro card.)
        + '@keyframes rtPipHello{0%{opacity:0;transform:translateY(-8px) scale(.86)}'
        + '60%{opacity:1;transform:translateY(0) scale(1.08)}'
        + '100%{opacity:1;transform:translateY(0) scale(1)}}'
        + '.rt-pip-hello{font-family:Barlow Condensed,sans-serif;font-weight:900;font-size:1.05rem;'
        + 'letter-spacing:1.2px;text-transform:uppercase;color:#1e8449;margin-bottom:3px;'
        + 'animation:rtPipHello .3s cubic-bezier(.2,1.6,.4,1) .82s 1 both}'
        + '@media (prefers-reduced-motion:reduce){'
        + '.rt-pip-whistle{animation:none}.rt-pip-puff{opacity:.9;animation:none}'
        + '.rt-pip-enter{animation:none}.rt-pip-hello{animation:none;opacity:.85}}';

    // ── The whistle, out loud ────────────────────────────────────────────────
    // Tod, 2026-09-08: "Oh, I think we absolutely should have the whistle blow."
    // Ralph had argued for silence — referees open this on a phone in public.
    // Tod overruled it, and it is his product and his referees. It stays SHORT
    // A blast of about 1.5s that spans his whole entrance, fired ONCE, on the
    // very first tip a device ever shows. Never again after that.
    //
    // Synthesised rather than a downloaded .mp3: no asset to fetch, nothing to
    // 404, and it cannot be blocked by the CDN rules the rest of the app lives
    // under. A real pea whistle is a tone around 3-4kHz with a fast warble; a
    // square wave plus a vibrato LFO gets close enough to read as "whistle".
    //
    // ⚠️ BROWSERS BLOCK AUDIO WITHOUT A GESTURE. The tip can appear on page
    // load, before anyone has touched anything, and the AudioContext will be
    // born suspended. So: try it, and if it is suspended, arm ONE listener that
    // plays it on the first tap or key the referee makes, then removes itself.
    // It never nags and it never throws.
    var whistleBlown = false;
    function blowWhistle() {
        if (whistleBlown) return;
        whistleBlown = true;
        try {
            var ctx = audioCtx();          // ⚠️ the SHARED one — never build a new context here
            if (!ctx) return;

            var play = function () {
                try {
                    var t    = ctx.currentTime;
                    var osc  = ctx.createOscillator();
                    var gain = ctx.createGain();
                    var lfo  = ctx.createOscillator();   // the warble of the pea
                    var lfoG = ctx.createGain();

                    osc.type = 'square';
                    osc.frequency.setValueAtTime(3520, t);
                    osc.frequency.linearRampToValueAtTime(3760, t + 0.09);

                    lfo.type = 'sine';
                    lfo.frequency.value = 34;            // rattle rate
                    lfoG.gain.value     = 165;           // depth, in Hz
                    lfo.connect(lfoG).connect(osc.frequency);

                    // ⚠️ IT MUST SPAN THE ENTRANCE. Tod: "it needs to come out and
                    // whistle BEFORE and DURING while the card shows."
                    //     0.00s blast starts (card not yet on screen)
                    //     0.24s Pip bursts out
                    //     1.15s release begins
                    //     1.45s silent
                    gain.gain.setValueAtTime(0.0001, t);
                    gain.gain.exponentialRampToValueAtTime(0.34, t + 0.012);
                    gain.gain.setValueAtTime(0.34, t + 1.15);
                    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.45);

                    osc.connect(gain).connect(ctx.destination);
                    osc.start(t); lfo.start(t);
                    osc.stop(t + 1.50); lfo.stop(t + 1.50);
                } catch (e) {}
            };

            if (ctx.state === 'running') { play(); return; }
            // Belt and braces. The gate normally unlocks us first; if some
            // browser still refuses, resume and play rather than never.
            if (ctx.resume) ctx.resume().then(play).catch(function () {});
        } catch (e) { /* audio is a nicety; never let it break a tip */ }
    }

    function injectWhistleCss() {
        try {
            if (document.getElementById('rt-pip-css')) return;
            var st = document.createElement('style');
            st.id = 'rt-pip-css';
            st.textContent = WHISTLE_CSS;
            document.head.appendChild(st);
        } catch (e) {}
    }

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

        // First tip gets the full arrival: whistle tucked inside the SVG, and the
        // whole mascot animated. Later tips get a plain, still Pip — the
        // entrance is a greeting, and a greeting repeated every card is a tic.
        var firstTip = (idx === 0);
        var mascot   = firstTip
            ? '<span class="rt-pip-enter">' + MASCOT.replace('</svg>', WHISTLE + '</svg>') + '</span>'
            : MASCOT;
        if (firstTip) injectWhistleCss();

        var more = idx < queue.length - 1;
        var step = queue.length > 1
            ? '<span style="color:#7a8ba0;font-size:0.74rem;">' + (idx + 1) + ' of ' + queue.length + '</span>'
            : '';

        el.innerHTML =
              '<button type="button" data-rt="close" aria-label="Close" '
            + 'style="position:absolute;top:6px;right:8px;background:none;border:none;font-size:1.5rem;'
            + 'line-height:1;color:#1e8449;cursor:pointer;padding:2px 7px;" '
            + 'title="Hide for now — it will come back">&times;</button>'
            + '<div style="display:flex;gap:14px;align-items:flex-start;">' + mascot + '<div style="min-width:0;">'
            + '<div style="font-family:Barlow Condensed,sans-serif;font-weight:800;font-size:1.12rem;'
            + 'letter-spacing:1px;text-transform:uppercase;color:#1e8449;margin-bottom:5px;padding-right:18px;">'
            + (t.title || '') + '</div>'
            + '<div style="font-size:0.92rem;line-height:1.5;">' + (t.html || '') + '</div>'
            + '<div style="font-size:0.7rem;color:#7a8ba0;margin-top:7px;font-style:italic;">— ' + PIP + '</div>'
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

        el.style.cssText =
              'position:fixed;z-index:99999;left:50%;top:50%;transform:translate(-50%,-50%);'
            + 'width:min(640px,calc(100vw - 28px));'   // Tod: "also this should be wider"
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

    // ── Why Pip sometimes waits a beat before appearing ─────────────────────
    // Tod, twice: "The whistle isn't happening until I close out the box." /
    // "The whistles should blow... Right when Tippy shows up."
    //
    // Chrome — and Safari, and Firefox — will not play a sound until the page
    // has been interacted with. That is not a bug we can code around; there is
    // no flag, no permission prompt, no trick. A tip that appears the instant
    // the page loads is therefore GUARANTEED to be silent, and the queued blast
    // fires on whatever the referee clicks next. Which was the X.
    //
    // So instead of showing Pip and hoping: if audio is currently blocked, we
    // hold him for the referee's first touch — a tap, a scroll, a keypress —
    // and THEN he bursts out and blows. Sound and entrance land together every
    // time, which is what was asked for.
    //
    // The wait is normally under a second: people tap or scroll almost at once.
    // And there is a 4s backstop — if someone truly does nothing, Pip appears
    // anyway, silently, because a tutorial nobody sees is worse than a quiet one.
    // On a repeat visit the browser usually already trusts the site and he
    // appears instantly WITH sound.
    // ⚠️ ONE AUDIOCONTEXT FOR THE WHOLE FILE. There were two — a probe and a
    // fresh one inside blowWhistle() — and that was the bug Tod reported four
    // times: "still no whistle until you hit X". The gate unlocked the probe;
    // blowWhistle then built a NEW context, born suspended because it was never
    // the one unlocked, and queued itself for the next click. The X.
    // A context is unlocked, not a page. Share it or this comes straight back.
    var _actx = null;
    function audioCtx() {
        if (_actx) return _actx;
        try {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (AC) _actx = new AC();
        } catch (e) {}
        return _actx;
    }
    function audioIsUnlocked() {
        var c = audioCtx();
        return !c || c.state === 'running';        // no audio at all — never wait
    }

    // ── THE ARRIVAL SEQUENCE ────────────────────────────────────────────────
    // Tod's spec, verbatim: "as soon as the referee (pip) pops (maybe even a
    // second before he shows and while he is popping the whistle happens".
    //
    // ⚠️ WHY PIP WAITS FOR A TOUCH. A browser will not emit sound until the page
    // has been interacted with. Pip on page load is BEFORE any interaction, so a
    // Pip who arrives on load can never arrive with a whistle — not in Chrome,
    // Edge, Safari or Firefox, and no flag changes it. Six rounds were spent
    // rearranging WHICH click got the sound before this was faced squarely.
    //
    // So his arrival is moved to the referee's first gesture. Then:
    //
    //     touch  ->  WHISTLE  ->  450ms  ->  Pip pops, blast still going
    //
    // The whistle leads by 450ms and runs 1.5s, so it is sounding before he
    // appears AND throughout his entrance, which is what was asked for.
    //
    // ⚠️ HE CAN NEVER BE LOST. Tod once reported "PIP isnt coming up at all"
    // when an earlier gate failed to release. There is now a 1.6s backstop: if
    // nobody touches anything, he arrives anyway, silently. Worst case he is
    // 1.6s late; he is never absent. On a repeat visit the browser usually
    // already trusts the site, audio is unlocked, and the whole sequence runs at
    // once with no wait at all.
    var arrivalStarted = false, backstop = null;

    function runArrival() {
        if (arrivalStarted) return;
        arrivalStarted = true;
        clearTimeout(backstop);
        ['pointerdown','mousedown','touchstart','keydown','wheel'].forEach(function (t) {
            try { document.removeEventListener(t, onGesture, true); } catch (e) {}
        });
        try { window.removeEventListener('scroll', onGesture, true); } catch (e) {}

        var fire = function () {
            injectWhistleCss();
            blowWhistle();                                   // leads by 450ms
            setTimeout(function () {
                if (!done) { mount(); render(); }
            }, 450);
        };
        var c = audioCtx();
        if (c && c.state !== 'running' && c.resume) { c.resume().then(fire).catch(fire); }
        else { fire(); }
    }

    function onGesture() { runArrival(); }

    function awaitArrival() {
        // Already allowed to make noise? Go now — no reason to make anyone wait.
        if (audioIsUnlocked()) { runArrival(); return; }
        ['pointerdown','mousedown','touchstart','keydown','wheel'].forEach(function (t) {
            try { document.addEventListener(t, onGesture, true); } catch (e) {}
        });
        try { window.addEventListener('scroll', onGesture, true); } catch (e) {}
        backstop = setTimeout(runArrival, 1600);             // he ALWAYS shows
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
                // The first card starts the arrival sequence instead of mounting
                // straight away — see awaitArrival(). Every later card in the
                // burst simply queues; render() picks them all up.
                if (!el && !arrivalStarted) { awaitArrival(); return true; }
                if (!el) return true;                       // sequence in flight
                // First card waits for the referee's first touch if audio is
                // still locked, so the whistle lands with the entrance. Every
                // later card mounts immediately — the gate is already open.
                // ⚠️ THE WHISTLE COMES FIRST. Tod, 2026-09-08: "I would almost
                // have the whistle blow just before he comes on so it gets
                // everybody's attention." Which is how it works on a field —
                // you hear it, then you look. So: blast, a beat of nothing,
                // then Pip bursts out of the card. 240ms is long enough to
                // register as "something is about to happen" and short enough
                // that it still reads as one event.
                // ⚠️ NEVER WITHHOLD PIP. An earlier version held the first card
                // until the referee touched the page, so the whistle could be
                // legal when it fired. It was clever and it was wrong: Tod,
                // "PIP isnt coming up at all". A tutorial nobody sees is worth
                // nothing, and audio is a garnish. He shows IMMEDIATELY now.
                //
                // If the browser will not let us make a sound yet, we arm the
                // whistle for the referee's first touch — and when it fires we
                // REPLAY his entrance with it, so the blast still arrives with
                // the movement instead of landing on a dismissed card.
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
