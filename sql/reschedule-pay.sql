-- ============================================================================
-- reschedule_pay — a referee is owed for the date a game LEFT
-- 2026-10-23
--
-- Tod, with a game kicking off tomorrow: "a game that gets rescheduled on/after
-- Thurs, the ref left behind gets paid... I'm afraid to approve the change
-- control because then the game gets moved forward and the referee gets lost."
-- And: "it's 'rescheduled'... we show it as 'rescheduled' in the pay portal
-- along with that referee as needing pay."
--
-- WHAT HAPPENS TODAY
--   A cancellation inside the club's cutoff lands on the pay portal and the
--   referee is paid — they turned other work down. A RESCHEDULE does not. The
--   row simply moves to the new date, the crew is carried across, and nothing
--   anywhere records that somebody held a Saturday that evaporated. RTCT10343
--   (U9 Boys vs RHAM, Sat 24 Oct, Jackson Durand solo) is the live case.
--
-- ⚠️ WHY A NEW TABLE AND NOT ref_payments.
--   ref_payments is UNIQUE on (game_id, slot) — one payment per slot per game.
--   A rescheduled game owes TWO things: the referee who lost the original date,
--   and whoever actually works it on the new one. Both are the same game and
--   the same slot, so the second would overwrite the first. Changing that key
--   means touching the table money is settled through; this leaves it alone.
--
-- ⭐ AND THEY ARE DIFFERENT FACTS. ref_payments means "this was paid for work
--   done". This means "we owe this person because we took their date away".
--   The pay portal shows it as RESCHEDULED, not as a game they worked.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================

CREATE TABLE IF NOT EXISTS reschedule_pay (
    id             bigserial PRIMARY KEY,

    game_id        bigint      NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    -- Copied at write time, as pay_overrides does, so the record still reads
    -- sensibly if the game is re-keyed.
    game_no        integer,
    slot           text        NOT NULL
                   CHECK (slot IN ('Center Referee', 'AR 1', 'AR 2')),

    -- ⚠️ THE REFEREE IS COPIED, NOT LOOKED UP LATER. The crew carries forward
    -- onto the new date and can then be changed — if this read the game's
    -- current crew it would pay whoever happens to be on it in November for a
    -- Saturday they never held.
    referee_id     bigint,
    referee_name   text        NOT NULL,

    -- The date they lost. Comes from games.rescheduled_from at write time.
    original_date  date        NOT NULL,
    -- Where it went, recorded so the portal can say "moved to 7 Nov".
    moved_to_date  date,

    -- ⛔ NULLABLE, AND USUALLY NULL. The workstation records WHO is owed; the
    -- pay portal works out HOW MUCH, because the band rates, the age bands and
    -- the solo bump live there and nowhere else. assignor-workstation.html says
    -- so in as many words: "NO SECOND RATE CALCULATOR LIVES HERE... this
    -- session has been one long lesson in what two copies of one rule do."
    -- Set it only to override what the portal would otherwise calculate.
    amount         numeric(8,2) CHECK (amount IS NULL OR amount >= 0),
    -- ⭐ Why they are owed. Same reasoning as pay_overrides.reason: an
    -- unexplained payment in November is the thing that causes the argument.
    reason         text        NOT NULL CHECK (btrim(reason) <> ''),

    -- Who decided it, and when the move happened.
    set_by         uuid,
    set_by_name    text,
    set_at         timestamptz NOT NULL DEFAULT now(),

    -- Settled separately from ref_payments, because it is a separate debt.
    -- ⭐ paid_amount IS THE AUTHORITATIVE FIGURE once settled — what actually
    -- left the account, frozen, so a later rate change cannot rewrite history.
    paid_at        timestamptz,
    paid_amount    numeric(8,2),

    -- ⭐ A game moved twice, inside the cutoff both times, owes for EACH date
    -- it left. The original date is therefore part of the key.
    CONSTRAINT reschedule_pay_once UNIQUE (game_id, slot, original_date)
);

COMMENT ON TABLE reschedule_pay IS
    'A referee is owed for a date a game was moved OFF, inside the club cancellation cutoff. Not a payment for work done - see ref_payments for that. Shows on the pay portal as RESCHEDULED against the original date.';
COMMENT ON COLUMN reschedule_pay.referee_name IS
    'Copied at write time. The crew carries forward onto the new date and may change, so looking it up later would pay the wrong person.';
COMMENT ON COLUMN reschedule_pay.original_date IS
    'The date the referee lost - games.rescheduled_from at the moment of the move. Part of the unique key: a game moved twice owes for each date it left.';

CREATE INDEX IF NOT EXISTS reschedule_pay_game_idx   ON reschedule_pay (game_id);
CREATE INDEX IF NOT EXISTS reschedule_pay_unpaid_idx ON reschedule_pay (original_date) WHERE paid_at IS NULL;

-- ⚠️ The pay portal reads under the ANON key, so a read policy is load-bearing
-- here, not laziness. Same posture as pay_overrides.
ALTER TABLE reschedule_pay ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reschedule_pay_all ON reschedule_pay;
CREATE POLICY reschedule_pay_all ON reschedule_pay FOR ALL USING (true) WITH CHECK (true);

-- ⚠️ GRANTS ARE REQUIRED FROM 2026-10-30. Supabase stops auto-granting Data
-- API access to new public tables on that date; without these the API returns
-- permission denied. Included now so a schema rebuild after the 30th works.
GRANT SELECT                         ON public.reschedule_pay TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reschedule_pay TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reschedule_pay TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.reschedule_pay_id_seq TO authenticated, service_role;


-- VERIFY ---------------------------------------------------------------------

SELECT column_name, data_type, is_nullable
FROM   information_schema.columns
WHERE  table_name = 'reschedule_pay'
ORDER  BY ordinal_position;

SELECT indexname FROM pg_indexes WHERE tablename = 'reschedule_pay' ORDER BY 1;

-- Should be empty.
SELECT count(*) AS owed FROM reschedule_pay;


-- ROLLBACK -------------------------------------------------------------------
-- DROP TABLE IF EXISTS reschedule_pay;
