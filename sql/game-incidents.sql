-- ============================================================================
-- game_incidents — no-shows and late scratches
-- 2026-09-20
--
-- Tod: "on Sheet 3 and Standard 2.... how do we mark a referee as a 'no
-- show'?" We couldn't. Nothing in the tool remembered who didn't turn up,
-- which is the single most valuable thing an assignor knows about a
-- referee and the one thing they had to keep in their head.
--
-- WHAT THIS IS
--   One row per incident. The referee STAYS in the game slot — the game
--   keeps showing what was planned; this row shows what happened. Nothing
--   here is ever deleted: a wrong click is RETRACTED (retracted_at set,
--   with who and why), and the retraction is part of the record.
--
-- KINDS
--   no_show       assigned, didn't turn up, didn't say
--   late_scratch  bailed inside 24 hours of kickoff
--   (others can be added — the CHECK is the list)
--
-- WHO READS IT
--   workstation slot chip (red stamp), ref pane dog tag (count this
--   season), referee-management history, pay portal ($0 · no show).
-- ============================================================================

CREATE TABLE IF NOT EXISTS game_incidents (
    id            bigserial   PRIMARY KEY,
    created_at    timestamptz NOT NULL DEFAULT now(),
    game_id       bigint      NOT NULL,      -- games.id (club games; tournament_games later if needed)
    game_no       integer,                   -- RTCT number at the time, so the log reads without a join
    referee_id    bigint      NOT NULL,      -- referees.id — deliberately NOT a foreign key: a log that
                                             -- vanishes when its subject is deleted is not a log
    referee_name  text        NOT NULL,      -- name at the time, same reason
    position      text        NOT NULL CHECK (position IN ('Center Referee','AR 1','AR 2')),
    kind          text        NOT NULL CHECK (kind IN ('no_show','late_scratch')),
    note          text,                      -- "never answered", "texted at 8:40 sick"
    covered_by    text,                      -- who actually worked it, if anyone
    marked_by     uuid,                      -- auth.users.id of the assignor
    marked_by_name text,
    retracted_at  timestamptz,               -- set = this incident is withdrawn; row stays
    retracted_by  text,
    retract_note  text
);

CREATE INDEX IF NOT EXISTS game_incidents_referee_idx ON game_incidents (referee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS game_incidents_game_idx    ON game_incidents (game_id);

COMMENT ON TABLE game_incidents IS
    'No-shows and late scratches, one row each. Never deleted — retract instead. Referee stays in the game slot; this is the record of what happened.';

-- RLS: assignors read and write, nobody anonymous sees a thing. This is
-- personnel data about minors; it never reaches a public page.
ALTER TABLE game_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS game_incidents_select_authenticated ON game_incidents;
DROP POLICY IF EXISTS game_incidents_insert_authenticated ON game_incidents;
DROP POLICY IF EXISTS game_incidents_update_authenticated ON game_incidents;
CREATE POLICY game_incidents_select_authenticated ON game_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY game_incidents_insert_authenticated ON game_incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY game_incidents_update_authenticated ON game_incidents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- no DELETE policy on purpose

-- Season count per referee — what the dog tag shows. Active (unretracted)
-- incidents on games dated in the current season window.
CREATE OR REPLACE VIEW referee_incident_counts AS
SELECT i.referee_id,
       count(*) FILTER (WHERE i.kind = 'no_show')      AS no_shows,
       count(*) FILTER (WHERE i.kind = 'late_scratch') AS late_scratches,
       max(i.created_at)                               AS last_at
FROM   game_incidents i
JOIN   games g ON g.id = i.game_id
WHERE  i.retracted_at IS NULL
  AND  g.date >= CASE WHEN extract(month FROM current_date) >= 8 THEN make_date(extract(year FROM current_date)::int, 8, 1)
                      WHEN extract(month FROM current_date) >= 3 THEN make_date(extract(year FROM current_date)::int, 3, 1)
                      ELSE make_date(extract(year FROM current_date)::int - 1, 8, 1) END
GROUP  BY i.referee_id;
GRANT SELECT ON referee_incident_counts TO authenticated;


-- VERIFY
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'game_incidents';
--  expected: true
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'game_incidents' ORDER BY cmd;
--  expected: INSERT, SELECT, UPDATE — no DELETE
SELECT count(*) FROM game_incidents;
--  expected: 0


-- ROLLBACK
-- DROP VIEW IF EXISTS referee_incident_counts;
-- DROP TABLE IF EXISTS game_incidents;
