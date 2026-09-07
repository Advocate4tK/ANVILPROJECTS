/* -- Referee experience --------------------------------------------------------
   ONE place that turns "when did this referee start" into "Seas 1 / Seas 2 / Yr 3".

   ⚠️ STORE THE FACT, NOT THE ANSWER. The old `Years Reffing` field held a LABEL
   the referee picked on the availability form — "Season 1 — my very first
   season". A label is true on the day it is typed and wrong for ever after:
   Jolie Clavette read Seas 1 from the day she was entered and always would have,
   and Eric was right to be annoyed about it.

   Worse, the form OVERWRITES that field on every submission, so referees coming
   back were re-picking "Season 1" — the question asked what they ARE, and the
   honest answer drifts. No background job can fix that; the system was faithfully
   storing what it was told.

   first_season stores the season they started. Everything else is derived at
   render time, so on the first day of a new season everyone advances because the
   arithmetic changed — no cron, no rollover script, nothing to forget.

   THE STANDARD (docket_season_cutover.md, and Tod has said it more than once):

       1st season   Seas 1
       2nd season   Seas 2
       3rd, 4th     Yr 2
       5th, 6th     Yr 3        ... and so on

   Seas 1 and Seas 2 are the two halves of year one. There is never a "Yr 1".

   ⚠️ ONLY SPRING AND FALL COUNT. Summer league and winter do not advance anyone,
   or a kid who plays summer ball would age a full year faster than one who does
   not. Two seasons per calendar year, always.

   first_season format: 'YYYY-S' where S is 1 for Spring, 2 for Fall.
   e.g. '2026-1' = Spring 2026.
   ---------------------------------------------------------------------------- */
(function () {
    'use strict';

    // Which half of the year a date falls in. Mar-Aug is the spring season,
    // Sep-Feb the fall one — a September start is Fall, and January belongs to
    // the fall season that began the previous September.
    function seasonIndexOf(d) {
        const dt = (d instanceof Date) ? d : new Date(d);
        if (isNaN(dt)) return null;
        const m = dt.getMonth();               // 0-11
        if (m >= 2 && m <= 7) return { year: dt.getFullYear(), half: 1 };   // Mar-Aug
        if (m >= 8)           return { year: dt.getFullYear(), half: 2 };   // Sep-Dec
        return { year: dt.getFullYear() - 1, half: 2 };                     // Jan-Feb
    }

    // Absolute season number, so two seasons can simply be subtracted.
    const ordinalOf = s => (s && s.year != null) ? (s.year * 2 + (s.half - 1)) : null;

    function parseFirstSeason(v) {
        if (!v) return null;
        const m = String(v).trim().match(/^(\d{4})-([12])$/);
        if (!m) return null;
        return { year: parseInt(m[1], 10), half: parseInt(m[2], 10) };
    }

    // How many seasons the referee has been active, counting the one they
    // started in as 1. Never less than 1 — a referee cannot be in their zeroth
    // season, and a future date is treated as their first.
    function seasonsElapsed(firstSeason, asOf) {
        const start = parseFirstSeason(firstSeason);
        if (!start) return null;
        const now = seasonIndexOf(asOf || new Date());
        if (!now) return null;
        return Math.max(1, ordinalOf(now) - ordinalOf(start) + 1);
    }

    // The label. Seas 1, Seas 2, then Yr 2 covering seasons 3-4, Yr 3 covering
    // 5-6, and so on: ceil(n / 2).
    function expLabel(firstSeason, asOf) {
        const n = seasonsElapsed(firstSeason, asOf);
        if (n == null) return '';
        if (n === 1) return 'Seas 1';
        if (n === 2) return 'Seas 2';
        return 'Yr ' + Math.ceil(n / 2);
    }

    // Sort key shared with the workstation's existing parseYrs(): Seas 1 = 0,
    // Seas 2 = 1, Yr 2 = 2. Keeps colour bands and ordering identical to what
    // assignors already read.
    function expValue(firstSeason, asOf) {
        const n = seasonsElapsed(firstSeason, asOf);
        if (n == null) return null;
        if (n <= 2) return n - 1;
        return Math.ceil(n / 2);
    }

    // The season a given date belongs to, as a storable string. Used when a
    // referee tells us the season they started, and to backfill from their
    // earliest availability submission.
    function seasonKeyOf(d) {
        const s = seasonIndexOf(d);
        return s ? `${s.year}-${s.half}` : '';
    }

    function seasonKeyLabel(v) {
        const s = parseFirstSeason(v);
        return s ? `${s.half === 1 ? 'Spring' : 'Fall'} ${s.year}` : '';
    }

    // The dropdown a referee picks from: this season back through ten years,
    // newest first, because most people answering are new.
    function seasonOptions(count) {
        const out = [];
        let cur = seasonIndexOf(new Date());
        let ord = ordinalOf(cur);
        for (let i = 0; i < (count || 20); i++) {
            const year = Math.floor(ord / 2);
            const half = (ord % 2) + 1;
            out.push({ value: `${year}-${half}`, label: `${half === 1 ? 'Spring' : 'Fall'} ${year}` });
            ord--;
        }
        return out;
    }

    window.RefExp = {
        seasonIndexOf, seasonKeyOf, seasonKeyLabel, seasonOptions,
        parseFirstSeason, seasonsElapsed, expLabel, expValue
    };
})();
