# Cleanup pass — CA-verified corrections

Started 2026-08-04, after pages 1–22 were imported (roster 1,448).

**Rule in force:** Central Assign is the system of record. Where CA and the Referee Tool
disagree, CA wins. Nothing here is written to the database until Tod approves the batch.

Each row is verified by a targeted 150%-zoom lookup in Central Assign, archived under
`Ralph/EYES/harvest/cleanup-NN`.

---

## Verified — pending Tod's approval to write

| # | CA ID | Name | Field | Referee Tool has | Central Assign has | Action |
|---|---|---|---|---|---|---|
| 1 | 38383 | Isabelle Anderson | email | `timmyanda@gmail.com` | `izzyanda@gmail.com` | UPDATE db row #2517 |

**Notes**

- **Isabelle Anderson #38383** (South Glastonbury, 15) — verified `cleanup-01`. Phone, town,
  age, gender all match exactly; email is the only difference. The tool's `timmyanda@` predates
  the page-2 import and came in with the original roster — almost certainly a parent address she
  registered with. The importer never overwrites a non-empty field, which is why the conflict
  survived rather than being silently corrected. My page-2 sweep read `izzyanda` correctly.

---

## Still to scan

**Wrong Central Assign ID — scan both names in the pair:**
- Georgia Barlow / Jonathan Argueta — CA 40097
- Reagan Christopher / Carter Smith — CA 39923
- Dylan Dolyak / Jaden Arana — CA 39602

**Email conflict — one name each:**
- Asa Augusta · Jackelyn Boice · John Bugai · Willa Buller · Eldar Celebic
- Antonio Cicolini · Andrew Costanza · Salvatore Dimauro · Mark Drega · Margaret Dykes

**Never captured:** ✅ DONE
- ~~Raheem Anderson #40504~~ — RESOLVED + IMPORTED 2026-08-04 as db #3585. 27, raheem2anderson@gmail.com, (860) 890-4885, East Hartford. Frame: cleanup-02

---

## Already settled without a scan

- **Noah Duelm #39867 / Walt Dombrowski #39887** — both confirmed against their own page frames
  (page 18 frame 1, page 17 frame 3). The tool has CA 39867 wrongly attached to Walt Dombrowski
  (db #2577); it belongs to Noah Duelm. That bad ID is why Noah never imported — the importer
  matched the ID, found Walt, and concluded Noah already existed. **Noah Duelm is still not in
  the tool.** Fix: set #2577 to 39887, then re-run the import so Noah lands.

---

## The eight duplicate people (separate job, no scan needed)

CA-ID dedupe could not match these because one row of each pair has no CA id:
Dylan Carvalho · Aaron Cherian · Jack Cotter · Brielle Daly · Alaina Pescatello ·
Yousef Ahmed · Quin Parrott · Enrico Obst

⛔ **DO NOT MERGE** — same name, different people: Julio Calvao (father/son) ·
Liam Baker (Weston 16 / Storrs Mansfield 14) · Jacob Carlson (Middletown 18 / Oakdale 16).
Aneesh Amaram holds two CA accounts — that is Central Assign's own duplicate, not ours.
