# Referee Tool — Changelog

## Versioning
- Format: MAJOR.MINOR.PATCH[-stage]
- Pre-1.0 = beta, not production-hardened
- 1.0.0 = full production release (see criteria below)

## 1.0.0 Release Criteria (not yet met)
- [ ] Wide 2, Command, Command 2 templates fixed (Array.isArray Airtable legacy removed)
- [ ] Supabase RLS enabled on all tables
- [ ] Staging/QA environment established
- [ ] Formal change control process in place
- [ ] Payment tracking live and tested (Griswold pilot)
- [ ] Per-assignor login (Eric gets own credentials)
- [ ] Backup + failback strategy documented per page

---

## [0.9.0-beta] — 2026-04-17 (current)

### Added
- Accounts system — multi-tenant, per-assignor login (Steps 1-10 complete)
- Plainfield onboarded — David Hurteau
- Sheet 3 — Eric's workspace, ref queue system with auto-seed, Exp toggle, hide columns
- Tournament module — tournament_games table, seed-tournament.html, tournament.html hub
- Tournament workstation — day tabs (Fri/Sat/Sun), AM/PM sections, ref pane cross-day grid
- Admin Portal — Assignor card, club/events management, tournaments table
- CA Export — tab-delimited format for Central Assign upload
- CA Import — referee import, venue/field management
- Season report — Rec/Comp game counts
- Assignor upload — wrapper page for club game submission
- Schedule changes — change request tracking
- Referee availability form — email lookup, merge, gender loop fixed, profile section
- Club game submit — CSV upload, Glastonbury format toggle
- Seed/purge tools — rebuilt 2026-04-01, 40 Glastonbury games, 65 refs
- game_type column (Rec/Comp/Tournament)
- Years Reffing changed to text — Seas 1 / Seas 2 / Yr N display
- Ref assignment storage — name stored directly (Supabase text, not Airtable ID array)
- Sheet 2 — drag/drop, color swatches, column reorder, zoom, resizable splitter, Supabase staging persistence
- Collapsible filter panel
- Weekend date picker UTC fix
- Assignor notes hover tooltip
- Dog tag color system (exp-based)
- NECONN 133 games imported, U10 AR toggle
- East Haddam — Star Ems, venue IDs
- Griswold refs seeded — 42 refs, venmo + payment_method columns added
- venmo, payment_method, Guardian Phone columns added to referees table

### Fixed
- Airtable key removed from config.js (was live in public source)
- wireSlotDragDrop drop handler — async + await on assignRef calls (race condition on ref swaps)
- Sheet 2/3 staging isolation attempted then reverted — staging3 was dropped 2026-04-07, all data in staging
- Standard template drag/drop — resolveRefName() replacing Array.isArray Airtable assumptions
- Ref sort persistence in Sheet 3
- Home/Away display
- UTC date shift in weekend quick-pick buttons

### Known Issues (blocking 1.0)
- Wide 2, Command, Command 2 templates still use Array.isArray(f['Center Referee']) — broken
- No RLS on Supabase tables
- No staging/QA environment
- No formal change control process
- Payment tracking not built (Griswold pilot designed, not implemented)
- Per-assignor login not built (Eric sees all clubs)
- admin.html still has Array.isArray references

---

## [0.8.0-beta] — 2026-04-08
- Tournament module polish, admin portal Clubs/Events, tournaments table

## [0.7.0-beta] — 2026-04-04
- Sheet 3 bug blitz: race condition, auto-seed, drag persist, queue order

## [0.6.0-beta] — 2026-04-02
- Drag/drop fixed, Sheet 3 queue, NECONN signals rebuild, assignor notes, 5 UX features

## [0.5.0-beta] — 2026-04-01
- Seed rebuilt, 40 Glastonbury games, Ref Exp display fixed

## [0.4.0-beta] — 2026-03-28
- Sheet 2 DONE: Ref Exp, drag/colors/menus, Supabase staging, resizable splitter

## [0.3.0-beta] — 2026-03-27
- Venues, CA import, export fixes

## [0.2.0-beta] — 2026-03-24
- Full Supabase migration complete (from Airtable)

## [0.1.0-beta] — 2026-03-01 (approx)
- Initial build — Airtable backend, basic assignment workflow
