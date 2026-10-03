-- ============================================================================
-- pay_overrides — an agreed rate, who agreed it, and why
-- 2026-10-03
--
-- Tod, from the Griswold pay portal: "We made a special offer to a referee to
-- pay them $80, where normally they would make $50, because I couldn't get the
-- game assigned... there needs to be an assignor override so that an increase
-- is marked by the assignor and reason given."
--
-- WHAT WAS HAPPENING INSTEAD
--   The $ box in the pay portal renders as value="${rate}", recalculated from
--   pay_rates on every draw. Typing 80 over it changed nothing: the Total kept
--   saying $110 (50+30+30), a refresh put it back to $50, and the next person
--   to open the portal saw $50. The number only reached the database if that
--   same session went on to mark it paid, because ref_payments.amount is read
--   out of the input at that moment. So the promise lived in Tod's head and
--   the portal quietly disagreed with it.
--
-- ⚠️ THIS IS NOT ref_payments. Two different facts, and they must not share a
-- row. An OVERRIDE is "this slot is worth $80 and here is why" — it exists
-- BEFORE anyone pays, and it is what the payer should be SHOWN. A PAYMENT is
-- "$80 left the account on this date". A game can have an override and never
-- be paid; a game can be paid with no override.
--
-- ⚠️ KEYED ON THE SLOT, NOT THE REFEREE — same decision as game_incidents made
-- the other way, and for the same reason. An incident is about a PERSON (they
-- didn't show), so it follows the person. This is about a GAME being hard to
-- cover, so it stays on the slot: if Donnie drops out on Friday and somebody
-- else takes it at short notice, the $80 still applies. It was never about
-- Donnie.
--
-- ⚠️ NO VIEW NEEDED, unlike game_incidents. That table got the anon-safe
-- game_incident_slots view because it carries referee names and the pay portal
-- reads under the anon key. There is no name in here — game, slot, money,
-- reason — so the portal reads the table itself.
--
-- Run in DBeaver: open this file and hit Alt+X.
-- ============================================================================

CREATE TABLE IF NOT EXISTS pay_overrides (
    id          bigserial PRIMARY KEY,
    game_id     bigint       NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    game_no     text,                           -- copied at write time; survives a re-key
    slot        text         NOT NULL,          -- games column name, as game_incidents.position
    amount      numeric(8,2) NOT NULL CHECK (amount >= 0),
    reason      text         NOT NULL CHECK (btrim(reason) <> ''),
    set_by      uuid,                           -- auth user, as game_incidents.marked_by
    set_by_name text,
    set_at      timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT pay_overrides_game_slot_key UNIQUE (game_id, slot),
    CONSTRAINT pay_overrides_slot_valid CHECK (slot IN ('Center Referee','AR 1','AR 2'))
);

-- ⚠️ reason is NOT NULL and non-blank ON PURPOSE. An unexplained $80 in
-- November is the thing that causes the argument. The database refuses it so
-- no later UI can quietly allow it.

COMMENT ON TABLE  pay_overrides IS
    'An assignor-agreed rate for one slot of one game, with the reason. The pay portal renders this INSTEAD of the pay_rates calculation. Not a payment - see ref_payments for what actually left the account.';
COMMENT ON COLUMN pay_overrides.slot   IS 'Center Referee / AR 1 / AR 2 - the games column name, matching game_incidents.position. Keyed on the slot, not the referee: the money is about the game being hard to cover, so it survives a crew change.';
COMMENT ON COLUMN pay_overrides.reason IS 'Why this slot is worth more than the band rate. Required - an unexplained number is worse than no number.';

CREATE INDEX IF NOT EXISTS pay_overrides_game_idx ON pay_overrides (game_id);

ALTER TABLE pay_overrides ENABLE ROW LEVEL SECURITY;

-- Same posture as the rest of the tool this season. Tod: "I hate RLS... and
-- ANON we can fix after the season is over." The pay portal reads under anon,
-- so a read policy is load-bearing here, not laziness.
DROP POLICY IF EXISTS pay_overrides_all ON pay_overrides;
CREATE POLICY pay_overrides_all ON pay_overrides FOR ALL USING (true) WITH CHECK (true);


-- VERIFY ---------------------------------------------------------------------

SELECT column_name, data_type, is_nullable
FROM   information_schema.columns
WHERE  table_name = 'pay_overrides'
ORDER  BY ordinal_position;

-- Empty on a fresh install. After Tod sets one it reads like a receipt.
SELECT o.game_id, o.game_no, g."Date", o.slot, o.amount, o.reason, o.set_by_name, o.set_at
FROM   pay_overrides o
JOIN   games g ON g.id = o.game_id
ORDER  BY o.set_at DESC;


-- ============================================================================
-- OPTIONAL — the one that prompted this: Donnie Owens, Griswold, centre at $80
-- against a band rate of $50. Easier to set from the workstation (right-click
-- the slot), but here it is as SQL. Fill in the game number first.
-- ============================================================================

-- games.game_no is a BARE NUMBER; RTCT is display only (RT_GAME_NO.fmt in
-- js/supabase-client.js). The workstation stores the formatted form here so
-- the row reads like a receipt on its own.
-- INSERT INTO pay_overrides (game_id, game_no, slot, amount, reason, set_by_name)
-- SELECT id, 'RTCT' || game_no, 'Center Referee', 80,
--        'Could not get the game covered at the band rate', 'Tod'
-- FROM   games WHERE game_no = 11567
-- ON CONFLICT (game_id, slot) DO UPDATE
--   SET amount = EXCLUDED.amount, reason = EXCLUDED.reason,
--       set_by_name = EXCLUDED.set_by_name, set_at = now();


-- ROLLBACK -------------------------------------------------------------------
-- DROP TABLE IF EXISTS pay_overrides;
