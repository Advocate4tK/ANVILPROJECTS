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

⚠️ **Correction.** An earlier draft of this file claimed the five orphan field
rows were Prince Hill's missing set. That was wrong — Prince Hill already has
all four attached:

```
id=56   RTFCT057  Field 1   CA=9004   -> should be 1290
id=57   RTFCT058  Field 2   CA=9005   -> should be 1291
id=176  RTFCT059  Field 3   CA=—      -> should be 1292
id=177  RTFCT060  Field 4   CA=—      -> should be 1293
```

The orphans (`Field 1 U8-U10`, `Field 2 U8-U10`, `Field 3 U8-U10`,
`Field 4 U15-U19`, and unnamed id 33) belong to some other venue and remain
unexplained. Do not attach them anywhere on a guess.

Prince Hill's four CA numbers can be typed straight into the CA FIELD ID boxes
on `venue-management.html`.

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

---

## 2026-09-02 — checked our zero-field venues against the CA directory

⚠️ **A zero field count is NOT automatically a gap.** CA itself lists a large
share of its 899 venues with **No fields** — that is the normal state there.
Every venue below was checked against CA individually. Do not put a venue on
this list because its count is zero; check CA for that specific venue first.

### NECONN's eleven zero-field venues — 5 of 11 resolved

| Venue | RT | CA ID | In CA | Verdict |
|---|---|---|---|---|
| Bentley Complex | RTVCT017 | 795 (Woodstock) | Grass #775, Turf #776 | **LOAD 2 fields** |
| Brooklyn Middle School | RTVCT018 | 959 (Brooklyn) | No fields | correct as-is |
| Bull Hill Park | RTVCT019 | 560 (No. Grosvenordale) | Field #1 #811, #2 #812, #3 #813 | **LOAD 3 fields** |
| Charles Bentley Athletic Complex | RTVCT020 | 770 (Woodstock) | No fields | correct as-is |
| Logee Field | RTVCT021 | 1113 (Putnam) | No fields | correct as-is |

**Still unchecked** — past "N", the sweep hit its step limit: Owen Tarr,
QL, Route 101 Field, Senexet Road, Thompson Middle School, Woodstock Middle
School.

### Cheshire — 3 of 4 resolved, all gaps

| Venue | RT | CA ID | In CA |
|---|---|---|---|
| Bartlem Park | RTVCT049 | 549 | 6 fields — #1534, #1535, #1591, #1592, #1593, #1594 |
| Cheshire Academy | RTVCT052 | 264 | 2 fields — #1584, #1585 |
| Cheshire High School | RTVCT053 | 987 | 1 field — Stadium #1748 |
| Quinnipiac Recreational Park | RTVCT081 | ? | unchecked — past "N" |

### Duplicates found IN Central Assign (theirs, not ours)

- **Bentley Complex #795** and **Charles Bentley Athletic Complex #770** — both
  Woodstock, almost certainly the same place, fields attached to #795 only.
- **Buckingham Park #813** and **Buckingham Park #1017** — both Glastonbury,
  different field sets (#1270/#1271 vs #1083/#1084).

### Also noted

- **Magnet School** (CA #923, Glastonbury) shows **No fields** in CA, but we
  hold 1 field for it. Ours is not derived from CA in that case.

### Harvest coverage

Frames in `Ralph/EYES/harvest/ca-venue-dir-01/` — 30 frames, A→N, with a gap:
frame 0015 ends at **Danbury**, frame 0028 resumes at **Highland Park**, so
**D through H was never captured**. Re-sweep needed for D–H and for O–Z.

### 2026-09-02 — Bull Hill Park CA id was wrong

We stored **CA 360**; the directory shows **Bull Hill Park, No. Grosvenordale
= CA 560** with Field #1 #811, Field #2 #812, Field #3 #813. A 3-for-5 slip.

Ruled out a second venue — neighbouring CA entries are Buck Hill Park (76,
Waterbury), Bunker Hill Park (561, Waterbury), Burnt Hill Park (577, Hebron).

Fix drafted in `sql/bullhill_fields.sql`. Nothing referenced 360 and 560 was
unused, but the justification is the directory, not the absence of references.

### Bentley Complex has THREE fields, not two

CA lists two (Grass #775, Turf #776). **Tod referees there: two grass and one
turf.** CA is short a field. `sql/bentley_fields.sql` loads Grass 1 (CA 775),
Grass 2 (**no CA Field ID — never invent one**) and Turf (CA 776).

⚠️ Consequence: a game on Grass 2 cannot map on the CA export until CA itself
has that field.
