-- ============================================================================
-- Is the ✉ count per ASSIGNMENT, or is it summing per REFEREE?
-- 2026-09-30
--
-- Tod: "the francis assignment has 2 on both mail symbols but I only mailed
-- 1x per assignment. I need it to parse per assignment and not overall."
--
-- TWO EXPLANATIONS FIT THE SAME PICTURE and only the rows can separate them:
--
--   (A) THE COUNT IS SUMMING PER REFEREE. Francis is on two games, each
--       mailed once -> 1 row per game -> but both chips read 2 because the
--       lookup collapsed the game out of the key. If this is it, Q1 returns
--       ONE row per game and the bug is in the code.
--
--   (B) THE COUNT IS HONEST AND TWO EMAILS REALLY WENT. Before the card-
--       collapse fix, clicking ✓ made the card fold up so it looked like
--       nothing happened -- Tod: "it didnt and I had to do it again to make
--       it work" -- and that second click re-sent. If this is it, Q1 returns
--       TWO rows per game, seconds apart, and the code is right.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================


-- ── Q1. THE DECIDER ─────────────────────────────────────────────────────────
-- Every assignment email ever sent about Francis Senat, one line each.
-- Look at the game number on the right and the gap between timestamps.
SELECT id,
       sent_at,
       where_text,
       -- seconds since the previous email for this SAME game + position
       EXTRACT(EPOCH FROM (
           sent_at - LAG(sent_at) OVER (
               PARTITION BY regexp_replace(where_text, '^.*· ', '')  -- "game N"
                          , regexp_replace(where_text, '^.*→ [^·]+· ([^·]+) ·.*$', '\1')
               ORDER BY sent_at)))::int AS secs_since_last_same_slot
FROM   blast_log
WHERE  where_text LIKE 'assignment%'
  AND  where_text ILIKE '%Francis Senat%'
ORDER  BY sent_at;
--
--  HOW TO READ IT
--    Two rows, DIFFERENT game numbers, gap NULL on each  -> explanation (A),
--        the code is collapsing the game out of the key. Ralph fixes the code.
--    Four rows, TWO per game number, gap of a few seconds -> explanation (B),
--        the count is true and the old double-click is what you are seeing.
--        Nothing to fix; optionally collapse same-slot sends inside a few
--        seconds so a double-click reads as one ask.


-- ── Q2. IS THIS WIDESPREAD? ─────────────────────────────────────────────────
-- Same-slot sends that landed within 30 seconds of each other, anywhere.
-- These are almost certainly double-clicks rather than genuine second asks.
WITH a AS (
    SELECT id, sent_at, where_text,
           regexp_replace(where_text, '^.*→ [^·]+· ', '') AS slot   -- "POS · game N"
    FROM   blast_log
    WHERE  where_text LIKE 'assignment:pending%'
), b AS (
    SELECT *, LAG(sent_at) OVER (PARTITION BY slot ORDER BY sent_at) AS prev
    FROM   a
)
SELECT slot,
       COUNT(*) FILTER (WHERE prev IS NOT NULL
                        AND sent_at - prev < interval '30 seconds') AS rapid_repeats,
       COUNT(*)                                                     AS total_sends,
       MIN(sent_at)::date                                           AS first_sent
FROM   b
GROUP  BY slot
HAVING COUNT(*) > 1
ORDER  BY rapid_repeats DESC, total_sends DESC;


-- ── Q3. WHAT THE CHIP IS ACTUALLY COUNTING ──────────────────────────────────
-- The per-slot tally exactly as the workstation computes it, so the number
-- here should match the ✉N on screen. If it does not, the bug is in the
-- render and not in the data.
SELECT regexp_replace(where_text, '^.*→ ', '') AS ref_pos_game,
       COUNT(*)                                AS asks,
       MIN(sent_at)                            AS first_ask,
       MAX(sent_at)                            AS last_ask
FROM   blast_log
WHERE  where_text LIKE 'assignment:pending%'
GROUP  BY 1
HAVING COUNT(*) > 1
ORDER  BY asks DESC, last_ask DESC;
