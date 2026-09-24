-- ============================================================================
-- leagues — a competition as a real record, not a string in an array
-- 2026-09-24
--
-- Tod: "we need to add CT CUP still as entity along with their pay rate...
-- when a game is uploaded as CUP to CA pay is automated... CA plugs in the
-- standard pay for it. Our system needs to show that somewhere."
--
-- WHY THIS TABLE EXISTS
--   Until now a league had no record anywhere. It was a string in a hardcoded
--   CA_LEAGUES array, mirrored by hand in three files (manage-clubs.html,
--   club-game-submit.html, js/central-assign-export.js), plus — for the two
--   cups — some rows in league_pay_rates that nothing on any screen could
--   show. So the mandated cup fee was real, correct, and invisible.
--
-- ⚠️ A LEAGUE IS NOT A CLUB, AND MUST NOT BE ONE.
--   The obvious move is to run it through the wizard as a club. Don't. A club
--   row means venues, a club portal, a submit form, a pay grid any assignor
--   may edit, a public schedule page, and an entry in every club dropdown in
--   the tool — as though children play FOR the Connecticut Cup. Tod,
--   2026-09-22: "instead of it being a club, I would consider it a league...
--   it's not going to have its own venues, for instance, because they're
--   going to be all over the place." A cup tie is played at the home club's
--   ground, by two clubs who each remain themselves.
--
-- WHAT A LEAGUE ACTUALLY OWNS
--   its name (which must match CA's dropdown EXACTLY or the export is
--   rejected), who runs it, what it pays, and how many officials it demands.
--   Nothing else.
--
-- ⚠️ MEMBERSHIP IS NOT STORED HERE.
--   Which clubs play in a league already lives on the club, in
--   clubs.ca_league. Storing it on both sides guarantees they disagree
--   eventually. The wizard writes clubs.ca_league; this table never does.
-- ============================================================================

CREATE TABLE IF NOT EXISTS leagues (
    id            bigserial PRIMARY KEY,
    -- ⚠️ Must match Central Assign's League dropdown character for character.
    -- CA rejects the import otherwise, and the rejection does not say why.
    name          text NOT NULL UNIQUE,
    display_name  text,
    kind          text NOT NULL DEFAULT 'district',
    -- Pay the competition mandates and no club may overrule. When true the
    -- rates in league_pay_rates beat clubs.pay_rates for any game in it.
    pay_locked    boolean NOT NULL DEFAULT false,
    -- Officials the competition demands. A cup tie is 3 whatever the age, and
    -- that is a rule of the competition, not of the club.
    -- NULL = no league rule, fall back to the club's crew_rules.
    crew_size     int,
    active        boolean NOT NULL DEFAULT true,
    -- Appears in CA's own dropdown. A league we track but CA does not list
    -- cannot be exported under that name.
    ca_listed     boolean NOT NULL DEFAULT true,

    director_name  text, director_email text, director_phone text,
    admin_name     text, admin_email    text, admin_phone    text,
    assignor       text, assignor_email text, assignor_phone text,
    assignors_json jsonb,

    age_groups    jsonb,
    notes         text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz
);

ALTER TABLE leagues DROP CONSTRAINT IF EXISTS leagues_kind_check;
ALTER TABLE leagues ADD  CONSTRAINT leagues_kind_check
    CHECK (kind IN ('cup','district','state','academy','other'));

COMMENT ON TABLE leagues IS
    'A competition. Owns its name, who runs it, what it pays and how many officials it demands - nothing else. Membership lives on clubs.ca_league, never here.';
COMMENT ON COLUMN leagues.name IS
    'Must match Central Assign League dropdown exactly. Mirrored by CA_LEAGUES in js/central-assign-export.js.';
COMMENT ON COLUMN leagues.pay_locked IS
    'The competition sets the fee and CA plugs it in on import. league_pay_rates then beats the club grid.';
COMMENT ON COLUMN leagues.crew_size IS
    'Officials the competition demands regardless of age. NULL = no league rule, use the club crew_rules.';

-- ── Seed: the 14 CA already accepts ─────────────────────────────────────────
-- Read off CA's own dropdown, sent by Eric 2026-08-29. These are not new —
-- they are the strings already flying around in three hardcoded arrays, now
-- written down once. The two cups are marked as they actually behave.
INSERT INTO leagues (name, kind, pay_locked, crew_size) VALUES
    ('CJSA Connecticut Cup',                           'cup',      true,  3),
    ('CJSA State Cup',                                 'cup',      true,  3),
    ('CJSA State League',                              'state',    false, NULL),
    ('CT Central/North Central District Travel League','district', false, NULL),
    ('CT Northeast District Travel League',            'district', false, NULL),
    ('CT Northwest District Travel League',            'district', false, NULL),
    ('CT Southcentral District Travel League',         'district', false, NULL),
    ('CT Southeast District Travel League',            'district', false, NULL),
    ('EDP Academy Zone I',                             'academy',  false, NULL),
    ('EDP Championship League',                        'academy',  false, NULL),
    ('EDP Futures',                                    'academy',  false, NULL),
    ('General Non-League Games',                       'other',    false, NULL),
    ('Stonington Tournament',                          'other',    false, NULL),
    ('USL Youth',                                      'other',    false, NULL)
ON CONFLICT (name) DO NOTHING;

-- league_pay_rates.league is a free text column that has to match leagues.name.
-- Nothing enforced that, so a typo in either place silently meant "this
-- competition pays nothing special" — the exact failure this whole piece of
-- work exists to end. A GAME's league stays free text (CA may add one tomorrow
-- and the games must not be blocked); the RATE CARD is not.
ALTER TABLE league_pay_rates DROP CONSTRAINT IF EXISTS league_pay_rates_league_fk;
ALTER TABLE league_pay_rates ADD  CONSTRAINT league_pay_rates_league_fk
    FOREIGN KEY (league) REFERENCES leagues (name) ON UPDATE CASCADE;

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

-- The club pay portal is PIN-gated and reads as anon; it needs the crew size
-- and the locked-pay flag to show a referee the right fee. Same reasoning as
-- league_pay_rates_read.
DROP POLICY IF EXISTS leagues_read ON leagues;
CREATE POLICY leagues_read ON leagues FOR SELECT USING (true);

DROP POLICY IF EXISTS leagues_write ON leagues;
CREATE POLICY leagues_write ON leagues FOR ALL
    USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS leagues_active_idx ON leagues (active) WHERE active;


-- VERIFY
SELECT name, kind, pay_locked, crew_size FROM leagues ORDER BY kind, name;
--  expected: 14 rows, the 2 cups pay_locked=true crew_size=3

SELECT l.name, count(r.id) AS rate_rows
FROM   leagues l LEFT JOIN league_pay_rates r ON r.league = l.name
GROUP  BY l.name HAVING count(r.id) > 0 ORDER BY 1;
--  expected: CJSA Connecticut Cup 3, CJSA State Cup 3

-- Every league named on a club that has no record here. Should be empty —
-- anything listed is a typo in clubs.ca_league worth fixing.
SELECT DISTINCT lg AS orphan_league_on_a_club
FROM   clubs c, jsonb_array_elements_text(
           CASE WHEN c.ca_league LIKE '[%' THEN c.ca_league::jsonb
                ELSE to_jsonb(ARRAY[c.ca_league]) END) AS lg
WHERE  c.ca_league IS NOT NULL
  AND  lg NOT IN (SELECT name FROM leagues);


-- ROLLBACK
-- ALTER TABLE league_pay_rates DROP CONSTRAINT IF EXISTS league_pay_rates_league_fk;
-- DROP TABLE IF EXISTS leagues;
