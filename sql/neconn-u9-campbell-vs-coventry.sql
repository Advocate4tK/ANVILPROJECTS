-- NECONN U9 Boys Comp game — Campbell vs Coventry
-- June 7 2026, 2:00 PM, WES Field 1
-- 3-man crew (Comp = center + 2 ARs)
-- NOTE: venue_id left null — assign WES venue via workstation after confirming venue ID

INSERT INTO games (date, "Time", "Home Team", "Away Team", "Age Group", game_type, "Source Club", field)
VALUES (
  '2026-06-07',
  '14:00',
  'Campbell',
  'Coventry',
  'U9 Boys',
  'Comp',
  'NECONN',
  'WES Field 1'
)
RETURNING id, date, "Time", "Home Team", "Away Team", "Age Group", game_type, field;
