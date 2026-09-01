# CA Venue Directory — what it corrected

Source: `cav3.ctreferee.net/assignor/venue-directory` — 898 venues with their CA
venue IDs, cities, and every field with its CA field number. Captured
2026-09-01 by copying the rendered table, not by screenshot.

**This is the dataset Ron Packard never sent.** Tod asked him for the CA venue
numbers and CA field numbers and got no reply, so the whole Fall 2026 venue
setup ran on names. It was in the assignor portal the entire time.

CA remains authoritative for CA uploads. RT codes (`RTVCT###`/`RTFCT###`) are
club-facing only. Nothing here changes what Central Assign receives.

---

## 1. The 9000-series is settled — they were ours

The README said invented, Tod believed they were real CA numbers. **The README
was right.** None of the five appear anywhere in Central Assign.

| Venue | We stored | CA actually has |
|---|---|---|
| Prince Hill Field (CA 887) | Field 1 = **9004**, Field 2 = **9005** | Field 1 **#1290**, Field 2 **#1291**, Field 3 **#1292**, Field 4 **#1293** |
| Riverside Park Field (CA 1072) | Field 1 = **9006** | **No fields at all** |
| Pomfret Rec Park (CA 912) | Field 01 = **9007** | Field 01 **#1106**, Field 01A **#959**, Field 01C **#960** |
| Woodstock Elementary (CA 915) | Field 1 = **9009** | Field 1 **#1285**, Field 2 **#1286**, Field 3 **#1287** |

Real CA field numbers run per-venue in the 1–1771 band. The 9000s ran as one
counter across four unrelated venues — a minting pattern, not an assignment.

⚠️ Riverside Park Field is worse than a wrong number: we invented a field that
does not exist in CA.

## 2. Prince Hill really does have four fields

Tod was right about the count, wrong about the numbers. CA lists Field 1–4 as
**#1290–#1293**.

Our four orphan field rows — ids 45, 46, 47, 48, named "Field 1/2/3/4" with
U8-U10 and U15-U19 splits, no `venue_id` — are almost certainly this set,
sitting detached while two wrong-numbered rows hold the venue.

## 3. Three NECONN venues have fields we never loaded

The note in memory saying NECONN's empty venues were "confirmed matching CA —
they genuinely have none" is **wrong for these three**:

| Venue | We have | CA has |
|---|---|---|
| Bentley Complex (CA 795) | 0 | Grass **#775**, Turf **#776** |
| Bull Hill Park (CA 560) | 0 | Field #1 **#811**, #2 **#812**, #3 **#813** |
| Owen Tarr (CA 911) | 0 | Field #1 **#814**, #2 **#815**, #3 **#816** |

These genuinely have none, and match: Brooklyn Middle School (958), Charles
Bentley Athletic Complex (770), Logee Field (1113), QL (913), Thompson Middle
School (1114), Route 101 Field (1071), Woodstock Middle School (916).

## 4. Rawson Field has four, not what we hold

CA 914 lists Field #1 **#818**, Field #2 **#819**, Field #3 **#820**, and
Field - U18 **#817**.

---

## Not yet done

Nothing above has been applied. Needs Tod's go, venue by venue:

- [ ] retire the five 9000-series numbers, set the real CA numbers
- [ ] delete or re-point the invented Riverside Park field
- [ ] attach orphan fields 45–48 to Prince Hill (CA 887) with #1290–#1293
- [ ] delete field id 33 (no name, no venue — junk row)
- [ ] load the missing fields for Bentley Complex, Bull Hill Park, Owen Tarr

Each of those gets an `RTFCT###` automatically once the insert triggers from
`sql/rt_codes.sql` are installed — **that part of the DDL never ran.** Only the
two ALTERs and the two backfills did.
