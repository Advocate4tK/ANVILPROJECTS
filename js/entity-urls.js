/* ═══════════════════════════════════════════════════════════════════════════
   Entity URLs — ONE place that knows what a club, event or tournament's
   public address is.

       rtUrl('neconn', 'schedule')   →  https://referee-tool.com/neconn/schedule
       rtUrl('rhamboree', 'pay')     →  https://referee-tool.com/rhamboree/pay

   ── WHY THIS FILE EXISTS ───────────────────────────────────────────────────
   Nine files used to hand-build these strings, which is how the site ended up
   with the schedule wanting ?club=NECONN while the portal wanted ?club=neconn.
   Change the scheme and you had to find every one of them. Now it's one edit.

   ── PATHS ARE NAMED BY FUNCTION ────────────────────────────────────────────
   /schedule, /portal, /pay, /audit, /availability mean the same thing whether
   the org is a club, an event or a tournament — only what sits behind them
   differs. Never name a path after an entity type or a job title: a high
   school isn't a club and has an athletic director, not a president, and a
   renamed folder is a dead link once the URL has been handed out.

   ⚠️ THE SLUG RULE HERE MUST MATCH scripts/build-entity-urls.mjs EXACTLY.
   That script creates the folders; this file points at them. If they disagree
   the cards link to 404s. Change one, change the other.
   ═══════════════════════════════════════════════════════════════════════════ */

const RT_BASE = 'https://referee-tool.com';

// Clubs that carry their own type in the name would give /kova-soccer-club/
// next to /neconn/. Strip the trailing type words.
const RT_TYPE_TAIL = /[\s-]+(youth[\s-]+soccer[\s-]+club|athletic[\s-]+association|youth[\s-]+soccer|soccer[\s-]+club|soccer[\s-]+association|soccer|sc|ysc)$/i;

/** Derive a club's folder slug from its name. Events and tournaments already
 *  carry their own stored slug/key — pass those straight to rtUrl(). */
function rtSlug(name) {
    let s = String(name || '').trim();
    const stripped = s.replace(RT_TYPE_TAIL, '').trim();
    if (stripped) s = stripped;                 // never strip a name to nothing
    return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// No folders exist for these, so a pretty URL would 404. KOVA is a test club.
// Girls Summer League has its own long-standing page and is not to be touched.
const RT_NO_NAMESPACE = new Set(['kova', 'girls-summer-league']);

/**
 * Public URL for an entity.
 * @param {string} slug   folder slug — rtSlug(clubName), or event.slug / tournament.key
 * @param {string} fn     'schedule' | 'portal' | 'pay' | 'audit' | 'availability' | ''
 * @param {string} legacy the old ?club=-style URL, returned when this entity has
 *                        no namespace. Always pass it — a card showing nothing is
 *                        worse than a card showing the long URL.
 */
function rtUrl(slug, fn, legacy) {
    const s = String(slug || '').trim().toLowerCase();
    if (!s || RT_NO_NAMESPACE.has(s)) return legacy || '';
    return `${RT_BASE}/${s}` + (fn ? `/${fn}` : '');
}

if (typeof module !== 'undefined' && module.exports) module.exports = { rtSlug, rtUrl, RT_NO_NAMESPACE };
