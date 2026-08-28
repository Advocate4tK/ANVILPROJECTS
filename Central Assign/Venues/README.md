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

> **Resolved 2026-08-28 — Old Killingly HS.** 9001/9002/9003 never existed as
> `fields` rows, so those 24 games resolved to an empty field name and were
> uploading to CA with **no field at all** — silently, for months. Remapped
> `9001→1614, 9002→1615, 9003→1616` on the game rows; venue 1023 is now clean
> (12/8/7 across Field #1/#2/#3, one game still fieldless).
> The exporter also now refuses to send any 9000-series number to CA
> (`INVENTED_FIELD_ID_FLOOR` in `js/central-assign-export.js`).

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

- **Six venues still hold 9000-series field IDs** — venue numbers are correct,
  but the field numbers are invented and need CA's real ones. Unlike Old KHS
  these *do* have `fields` rows, so they fall back to the field NAME on upload
  and still import as long as CA's spelling matches — worth fixing, not urgent.
  As of 2026-08-28, 33 games ride on these:

  | venue | CA venue # | invented field IDs | games |
  |---|---|---|---|
  | Riverside Park Field | 1072 | 9006 | 9 |
  | Prince Hill Field | 887 | 9004, 9005 | 9 |
  | Pomfret Rec Park | 912 | 9007 | 6 |
  | Rawson Field | 914 | 9008 | 5 |
  | Woodstock Elementary | 915 | 9009 | 4 |
- **Shepherd Hill**, **Sterling Town Hall**, **Sterling Community School** — no CA
  number at all, so they cannot upload.
- Two Bentley complexes in Woodstock, **795** and **770**, same road, different
  street numbers, neither in the active pool. One venue twice, or two venues?
