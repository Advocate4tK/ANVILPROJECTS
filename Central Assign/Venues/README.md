# Central Assign — venue reference

**Central Assign is law.** These files are the written record of what CA actually
holds, so nobody has to squint at a screenshot or trust a stale export.

| file | what it is |
|---|---|
| `ACTIVE-POOL.csv` | Every venue in Eric's "Venues in Active Pool" screen — CA number, name, address, city. |
| `FIELD-IDS.csv` | Field IDs per venue, straight from the database. ⚠️ The NEW Central Assign UI does not show field numbers outwardly, so once these leave the database there is no way to look them up again. |
| `Eric1-4.png`, `OldKHS.png`, `RHAM VENUES` | The original screenshots the CSVs were transcribed from. |

## Do not use the Airtable export

`AIRTABLE DATA EXPORT TO SupaBase DB/Venues-Grid view.csv` is a stale
pre-migration snapshot. It is **wrong** on Buckingham Park, Knox Lane,
Blackledge Field, Burnt Hill Park and West Road Memorial Field. Trusting it on
2026-08-12 produced two confidently incorrect "your data is broken" reports
about data that was fine. Use the CSVs here instead.

## Two fingerprints of bad data, both found 2026-08-12

**Field IDs in the 9000 series are invented.** Sequential from 9000 is what
someone types when they need a number and doesn't have one. The fake "Old KHS"
venue carried 9001/9002/9003 while the real Old Killingly HS (1023) has
1614/1615/1616. Any venue holding 9000-series fields deserves a look.

**Some venue IDs came in exactly 100 low.** 812 should be 912 (Pomfret Rec
Park); 816 should be 916 (Woodstock Middle School). Both confirmed against CA.
So if a venue is missing from the active pool, check whether its number **plus
100** is a real CA venue before assuming it is retired.

Still unverified on that pattern, as of 2026-08-12 — do not change without
checking Central Assign:

- Blackwell Field (Canterbury) — 845, possibly 945
- Manship Park (Canterbury) — 899, possibly 999
- Crandall Park — 383, possibly 883

## Other open questions

- **Rawson Field (914)** and **Riverside Park Field (1072)** — venue numbers are
  correct, but their field IDs are 9000-series and need CA's real ones.
- **Shepherd Hill**, **Sterling Town Hall**, **Sterling Community School** — no CA
  number at all, so they cannot upload.
- Two Bentley complexes in Woodstock, **795** and **770**, same road, different
  street numbers, neither in the active pool. One venue twice, or two venues?
