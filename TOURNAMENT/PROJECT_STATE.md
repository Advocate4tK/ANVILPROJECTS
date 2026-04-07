# Tournament Module — Project State

## Active Tournament
**Glastonbury Spring Warmup 2026**
- Dates: Fri Apr 24 – Sun Apr 26, 2026
- ~534 games total
- Eric Baughman is the assignor
- Data source: Eric's Glastonbury master signup sheet (xlsx) — lives in `Glast 26/`
- Tournament key in code: `glastonbury-2026`

---

## Glastonbury Site Map — AUTHORITATIVE
We built this list together. Do not guess or deviate from it.

| Site | Name(s) in spreadsheet | Names in Supabase / aliases |
|------|------------------------|-----------------------------|
| Site 1 | Addison Park | Addison Park |
| Site 2 | Buckingham Park | Buckingham Park |
| Site 3 | GEHMS | GEHMS |
| Site 4 | GHS | GHS, Glastonbury High School |
| Site 5 | Gideon Welles | Gideon Welles |
| Site 6 | Hebron Ave School, Abraham Avenue School | Hebron Ave School, Abraham Avenue School, Veteran's Park (Hebron) |
| Site 7 | Irish American Home | Irish American Home, Irish American Hibernian |
| Site 8 | Knox Lane | Knox Lane |
| Site 9 | Nayaug School | Nayaug School |
| Site 10 | Riverfront Park | Riverfront Park, Riverfront Park (Glastonbury) |
| Site 11 | Rotary | Rotary |
| Site 12 | Smith Middle School | Smith Middle School |

**Veteran's Park (Hebron)** — Site 6 (confirmed by Tod — same site as Hebron Ave School).

Site photos (for reference) live in this folder: addison.png, buc.png, gehms.png, heb.png, irish.png, knox.png, nayaug.png, river.png, rotary.png, smith.png, site11.png

---

## GLASTONBURY_SITE_LOOKUP in Code
Location: `assignor-workstation.html` ~line 4449
Display-only map: `venue name → site number`. DB always uses numeric Venue ID.
Add new venue name aliases here when discovered — never change the site numbers.

## Venue ID → Name Map (tournamentVenueMap)
Location: `assignor-workstation.html` ~line 4929
Injects abbreviated names into `allVenues` at load time for tournament mode.

```
123  → Addison Park       506  → Riverfront Park
314  → Buckingham Park    567  → GHS
417  → Nayaug School      645  → GEHMS
923  → Hebron Ave School  1017 → Irish American Home
1021 → Smith Middle School
1082 → Gideon Welles      1083 → Knox Lane
1097 → Knox Lane          1149 → Rotary
```

---

## Ref Experience Data
- Cert year imported from Eric's spreadsheet (column S "Cert Year") via `import-cert-year.html`
- Wrote to `Years Reffing` in `referees` table for 140 refs — April 2026
- `certYrToExp(v, colored)` converts 4-digit cert year → Yr N display label
- Column in tournament ref pane: "Ref Exp" (renamed from "Cert Yr")
- Junk values in data: "1990's", "97 I think", "2-3 years ago", "2024-2025", "N/A" — render as-is

---

## Open Issues
- **103 Opt columns**: Staging table has a game with ~103 refs queued. Likely auto-seed ran before tournamentMode was set. Fix: purge tournament staging records and let Eric assign manually.
- **"—" rows (no venue/field)**: Games whose spreadsheet venue names couldn't be mapped during seed import. Fix: cross-reference Eric's spreadsheet for those rows.
- **Veteran's Park (Hebron)**: Unknown site number — ask Eric.

---

## Tournament Isolation Rule — CRITICAL
Nothing from the clubs template touches tournament without explicit Tod approval.
`window.tournamentMode` guards all club-only UI in shared rendering zones.
Always guard club-side changes with `!window.tournamentMode` in shared code paths.

---

## Architecture
- Tournament games: `tournament_games` table (separate from club `games`)
- Staging: shared `staging` table — game_id references tournament_games IDs
- Availability: shared `availability` table — filtered by tournament date range
- `window.tournamentMode` set on assignor login when tournament is selected
- `window.tournamentSiteLookup` = `GLASTONBURY_SITE_LOOKUP` at runtime
