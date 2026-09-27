-- ============================================================================
-- games.refs_notified_2h — did the crew get two hours' notice?
-- 2026-09-27
--
-- Tod: "remember if weather then the referees dont get paid unless they were
-- notified less than 2 hours before game time" ... "it should specify if rain...
-- did refs get notified 2 hours before?"
--
-- THE RULE IS ALREADY IN THE CONTRACT
--   billing-contracts.html, clause 920: "Referees must receive a minimum of two
--   (2) hours' notice of any match changes or cancellations due to weather or
--   other extenuating circumstances."
--
--   So a weather cancellation carries no fee only if that notice was given.
--   Inside two hours the crew is paid. The cancel dialog has been telling
--   assignors the opposite all season — "Refs are NOT paid regardless of notice
--   time" — which is the line somebody reads at the moment they decide.
--
-- WHY IT IS ASKED AND NOT CALCULATED
--   The tool knows when the button was pressed. It does not know when the
--   referees were actually told, and those are rarely the same moment: a 6am
--   phone round for a 2pm kickoff gets recorded whenever somebody next opens a
--   laptop. Calculating from the click would quietly underpay the assignor who
--   made the calls early and did the admin late.
--   The dialog shows the time-to-kickoff as a hint and lets the person who made
--   the calls answer.
--
-- TRUE  = notified two hours or more before kickoff → no fee, per the agreement
-- FALSE = inside two hours → the crew is paid
-- NULL  = not a weather cancellation, or nobody has said
--
-- ⚠️ NOTHING COMPUTES PAY FROM THIS YET. No pay path reads cancellation_type
-- either — cancellations are settled by hand today. This exists so the answer
-- is recorded at the moment it is known, rather than reconstructed in February
-- from somebody's memory of a rainy Saturday.
-- ============================================================================

ALTER TABLE games ADD COLUMN IF NOT EXISTS refs_notified_2h boolean;

COMMENT ON COLUMN games.refs_notified_2h IS
    'Weather cancellations only: TRUE = the crew had two hours notice or more, so no fee is due under the club agreement. FALSE = cancelled inside two hours, the crew is paid. NULL = not a weather cancellation, or unanswered. Asked of the assignor, never inferred from when the button was pressed.';


-- VERIFY — the column is there and nothing claims an answer yet.
SELECT count(*) AS total_games,
       count(refs_notified_2h) AS answered
FROM   games;
--  expected right now: answered = 0


-- Weather cancellations already on the books, which predate the question.
-- They stay NULL: nobody is going to reconstruct the notice given on each, and
-- a guess in this column is worse than an empty one.
SELECT game_no, date, time, "Source Club", "Home Team", "Away Team", cancelled_at
FROM   games
WHERE  cancellation_type = 'weather'
ORDER  BY date DESC, time;
--  for reference only — expect the nor'easter cancellations from 26 Sep.


-- ROLLBACK
-- ALTER TABLE games DROP COLUMN IF EXISTS refs_notified_2h;
