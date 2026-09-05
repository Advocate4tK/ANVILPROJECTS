-- ============================================================================
-- ca_imported_at + ca_export_batch — did Central Assign actually TAKE the game?
-- ============================================================================
-- Run in DBeaver: SQL Editor > Execute script (Alt+X).
--
-- Tod, 2026-09-05: "Only after a successful confirmation that games have been
-- uploaded into Central Assign should those numbers be pushed."
--
-- Exporting is not uploading. On 2026-09-03 a file exported perfectly and CA
-- rejected every row on the venue id — under an export-only flag those four
-- games would have shown green while sitting nowhere. So three states:
--
--   neither set                  RED    — never sent
--   ca_exported_at only          AMBER  — in a file, CA has not confirmed it
--   ca_imported_at set           GREEN  — CA took it, and Tod says so
--
-- Only the last one counts as done. Every badge and count reads ca_imported_at.
--
-- ca_export_batch groups one export file so a whole upload is confirmed with one
-- click instead of fourteen. Games re-exported later get the newer batch id;
-- that is intended — the latest file is the one being uploaded.
-- ============================================================================

alter table public.games            add column if not exists ca_imported_at  timestamptz;
alter table public.games            add column if not exists ca_export_batch text;
alter table public.tournament_games add column if not exists ca_imported_at  timestamptz;
alter table public.tournament_games add column if not exists ca_export_batch text;

comment on column public.games.ca_imported_at is
    'When Central Assign was CONFIRMED to hold this game. NULL = outstanding, whether or not it was exported.';
comment on column public.games.ca_export_batch is
    'Groups games written into the same export file, so one confirmation covers the whole upload.';

create index if not exists games_ca_import_idx on public.games (ca_imported_at);

-- ── Backfill: NECONN Week 1 ────────────────────────────────────────────────
-- Tod, 2026-09-04: "the NECONN games uploaded perfectly to CA." Confirmed by the
-- importer itself, so these are genuinely green, not merely sent.
update public.games
   set ca_imported_at = coalesce(ca_imported_at, timestamptz '2026-09-04 20:30:00-04'),
       ca_export_batch = coalesce(ca_export_batch, 'backfill-neconn-wk1')
 where "Source Club" ilike 'neconn'
   and games.date = date '2026-09-12'
   and ca_exported_at is not null;

select "Source Club",
       count(*) filter (where ca_imported_at is not null)                          as in_ca,
       count(*) filter (where ca_imported_at is null and ca_exported_at is not null) as sent_unconfirmed,
       count(*) filter (where ca_imported_at is null and ca_exported_at is null)     as never_sent
  from public.games
 where games.date >= current_date
 group by "Source Club"
 order by "Source Club";
