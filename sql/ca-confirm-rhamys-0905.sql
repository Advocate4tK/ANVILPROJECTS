-- ============================================================================
-- RHAMYS — both upcoming games confirmed in Central Assign (2026-09-05)
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- CA's row-by-row result, 8:40 AM:
--   row 1  OK
--   row 2  "Field conflict: Game #404236 is already scheduled at Blackledge
--          Field - #1 on 2026-09-08 at 18:00:00. U9: RHAM vs Colchester"
--
-- ⚠️ THAT CONFLICT IS OUR OWN GAME. CA already holds it as #404236 — Eric
-- entered it directly — but its duplicate matcher did NOT recognise it, so it
-- reported a field conflict instead. Same meaning, different words: CA has the
-- fixture, and re-sending it will not help.
--
-- So "Duplicate" is not the only way CA says it already has a game. A field
-- conflict against your OWN fixture at your own venue and time is the matcher
-- failing, most likely because the team strings we send do not match what was
-- typed into CA by hand.
-- ============================================================================

update public.games
   set ca_exported_at = coalesce(ca_exported_at, now()),
       ca_imported_at = coalesce(ca_imported_at, now())
 where "Source Club" ilike 'rhamys'
   and games.date >= current_date
   and ca_imported_at is null;

select "Source Club",
       count(*) filter (where ca_imported_at is not null)                           as in_ca,
       count(*) filter (where ca_imported_at is null and ca_exported_at is not null) as sent_unconfirmed,
       count(*) filter (where ca_imported_at is null and ca_exported_at is null)     as never_sent
  from public.games
 where games.date >= current_date
 group by "Source Club"
 order by "Source Club";
