# Central Assign harvest — what's done, what's left

**Last updated: 2026-08-29**

## ⚠️ PAGE NUMBERS DRIFT — track the NAME, not the page

The directory grew **3,278 → 3,472** between 2026-08-04 and 2026-08-29, which pushed
every page forward by roughly one. Old page 22 ended at *Garcia*; on 8/29 that content
sat on page 23–24. Resuming by page number silently re-sweeps ground already imported —
it cost two wasted sweeps on 8/29 before anyone noticed.

**Resume by the last surname imported.** The page number is only a hint.

## Status: complete through **GOODBURN** ✅

Page 25 of 70 swept at 150% and imported 2026-08-29 (Liam Gibson → Harry Goodburn).
50 rows: 49 CT, 1 out-of-state omitted (Brian Good, Harleysville PA).
**42 inserted, 7 updated, 0 ambiguous, 0 duplicate CA IDs.** Roster 1,477 → **1,519**.
⚠️ Elizabeth Glover #35084 imported with registration_year 2022, EXPIRED in CA — in the
roster but must not be assignable. Tenth expired registration the importer tracks.

⭐ Next sweep starts at the first surname AFTER **Goodburn** — page 26 on 8/29 numbering,
but CHECK THE FIRST NAME before transcribing.

## Status: complete through **GIBSON** ✅

Page 24 of 70 swept at 150% and imported 2026-08-29 (Ganesh → Gibson). 50 rows: 49 CT,
1 out-of-state omitted (Simon Ghebremariam, Rockland MA). **35 inserted, 2 updated,
0 ambiguous, 0 duplicate CA IDs.** Roster 1,442 → **1,477**.
Brianna Gerster #38642 matched an existing row by name+town and was gap-filled with her
CA ID, email and age. Jaslyn Garcia #40328 gap-filled phone.

⭐ Next sweep starts at the first surname AFTER **Gibson** — on 8/29 numbering that is
page 25, but CHECK THE FIRST NAME ON THE PAGE before transcribing.

## Status: pages 1–22 COMPLETE ✅ (Tods target reached)

Page 22 swept AT 150% and imported 2026-08-04 (Francis → Garcia). 50 rows: 48 CT imported,
2 out-of-state omitted (Turner Frankosky MA, August Frazier VT). 35 new referees, 13 gap-fills,
0 ambiguous. Roster 1,413 → **1,448**. Luke Gallagher #39408 phone truncated in CA (8 digits)
— stored null, third instance of that CA defect.

Page 21 swept AT 150% and imported 2026-08-04 (Field → Franchini). 50 rows: 48 CT imported,
2 out-of-state omitted (Robin Foley FL, Nilton Fortes NY). 36 new referees, 12 gap-fills,
0 ambiguous. Roster 1,377 → **1,413**. Ben Foley #35197 imported flagged EXPIRED (reg 2022).
⭐ Liam Forsyth #39886 (Canterbury) is in ALL FOUR pools — East Haddam, Griswold, NorthEast, REFS.

Page 20 swept AT 150% and imported 2026-08-04 (Fairclough → Ficacelli). 50 rows: 47 CT
imported, 3 out-of-state omitted (Fallis MI, Feigenbaum NY, Fernandes NY). 32 new referees,
13 gap-fills, 0 ambiguous. Roster 1,345 → **1,377**. Thomas Felice #788 landed as
**National AR** and Anthony Fiatarone #31018 as **Regional**.

⭐ Both Fauxbels reconciled: Alex #2520 now carries CA 19823, Jonathan #2461 carries CA 29256.
Jonathan is the referee whose disappearance exposed the 1000-row cap.

Page 19 swept, RE-SWEPT AT 150% ZOOM, and imported 2026-08-04 (Eltaeib → Fairclough).
50 rows: 49 CT imported, 1 out-of-state omitted (Matthew Evans NY). 43 new referees,
6 gap-fills, 0 ambiguous. Roster 1,302 → **1,345**. Colin and Tyler Fairchild both
landed with `Certification Level = Regional`.

Page 18 swept and imported 2026-08-04 (Duelm → Elsendyouney). 50 rows: 47 CT imported,
3 out-of-state omitted (Dolce PA, Dowling MA, Dryden CA). 36 new, 10 gap-fills.
Roster 1,266 → 1,302. **Noah Duelm was blocked** — see the CA-ID collision section below.

---

## ⚠️⚠️ SWEEP AT 150% BROWSER ZOOM — NOT 100%

**Ctrl + twice before arming F4.** This is not optional and it is not cosmetic.

At 100% on a 1500px capture, the glyphs **`i` and `l` are visually identical** in this
font, and a **period inside an email is invisible**. Page 19 was read twice to measure it:

- 3 rows flagged as i/l-ambiguous at 100% — all three turned out correct at 150%
- **1 row was silently WRONG**: John Evans read as `ynwa96je@gmail.com`, actually
  `ynwa96.je@gmail.com`. Nothing about it looked suspicious. Re-reading the 100% frames
  a hundred times would never have caught it.

**That is a ~2% silent error rate on emails**, and email is the only channel to a referee
who has never submitted availability. A wrong address does not error — it just never
arrives, and the referee looks unresponsive.

Cost: ~15 scroll steps per page instead of 10. Pages 1–18 were swept at 100% and carry
an unmeasured error rate; see the cleanup list below.

---

## Status: pages 1–17 COMPLETE

Page 17 swept and imported 2026-08-04 (DiTommaso → Dudley). 50 rows: 47 CT imported,
3 out-of-state omitted (Alexander Dolce PA, Stephen Dowling MA, Russell Dryden CA).
40 new referees, 6 gap-fills, 0 ambiguous. Roster 1,226 → **1,266**.

Page 16 swept and imported 2026-08-04 (Demko → Dissa). 50 rows: 48 CT imported,
2 out-of-state omitted (Del Desousa FL, Matthew Dias MA). 38 new referees, 7 gap-fills,
0 ambiguous. Roster 1,188 → 1,226.

**Directory total is confirmed at 3,278 referees across 66 pages** (visible in the page-16
header). At ~48 CT rows per page, pages 17–66 hold roughly 2,400 more.

---

## ⭐ WORKFLOW RULE (Tod, 2026-08-04) — import after every pass

**One page = one complete cycle. Do not batch pages and import them later.**

```
sweep (F4) → archive frames to EYES/harvest/page-NN → transcribe to page-NN.json
           → node scripts/ca-import.mjs           (preview, read the skips)
           → node scripts/ca-import.mjs --write    (writes + backs up first)
           → verify roster count → update this file → next page
```

A page is not "done" until the rows are **in the database**. Staged-but-not-imported is the
state that caused the pages 4–13 backlog — 245 rows sat captured and unread for days, and Tod
found out only when he went looking for a referee who should have been there.

Verify after each write: paginated count went up by the expected number, and **0 duplicate
Central Assign IDs**. That second check is what catches a truncated read before it becomes
another 81-person dedupe job.

### ⭐ SAY IT EXPLICITLY (Tod, 2026-08-04)

Every page must be reported to Tod with the word **UPLOADED**, plainly, in these terms:

> **Page NN — UPLOADED to Referee Tool.** X inserted, Y updated. Roster is now Z.

Never let "read", "staged", "transcribed", "processed" or "done" stand in for it. Those words
describe a JSON file on disk and Tod cannot use a JSON file. Only "UPLOADED" means the referees
are in the database and searchable in the workstation.

If a page has been transcribed but NOT written, say that just as plainly — **"Page NN is staged,
NOT uploaded"** — and say what is blocking it. Silence on this point is how 245 rows sat unread
for days while everyone assumed they were in.

## Status: pages 1–15 COMPLETE

All 50 rows of every page from 1 through 15 have been read off the archived
frames and imported. The nine-page backlog (pages 4–13, roughly 245 rows that
were captured but never transcribed) was cleared on 2026-08-03.

```
page 01   50/50   page 06   50/50   page 11   50/50
page 02   49/50   page 07   50/50   page 12   50/50
page 03   50/50   page 08   50/50   page 13   50/50
page 04   50/50   page 09   50/50   page 14   50/50
page 05   50/50   page 10   50/50   page 15   50/50
```

Directory is 66 pages. **Pages 16–66 have never been captured.**

---

## The one row still outstanding — ✅ CLEARED 2026-08-04

**Raheem Anderson #40504 is resolved and imported.** A targeted name search in Central Assign
returned his full row: 27, raheem2anderson@gmail.com, (860) 890-4885, East Hartford, reg 2026,
adult with no Minor tag. Nothing guessed. Staged as `page-02-raheem.json`, imported as db #3585.
Frame archived at `Ralph/EYES/harvest/cleanup-02`.

**Every row of pages 1–22 is now read and uploaded. No outstanding partials.**

### Previously outstanding

| CA ID | Name | Page | What's missing |
|---|---|---|---|
| 40504 | Raheem Anderson | 2 | email, phone, town, age — only the name and ID were legible |

His row sat on a frame edge with everything but the name cut off. A guessed
value would look identical to a real one once it was in the table, so he was
deliberately left out rather than filled in.

**How to clear it:** search his name in Central Assign, press **F4**, scroll so
the row sits mid-screen, F4 off. One frame, one referee. Faster than
re-sweeping page 2, and no frame-edge problem because you control where the row
lands.

### ✅ Resolved
- **Deisy Cisneros #40962** — was on this list for the same reason. Her row
  turned out to be fully legible on page 12 frame 6 (Glastonbury,
  deisy.referee@gmail.com, 917-940-7700). Imported 2026-08-03, nothing guessed.

---

## Two data problems found in Central Assign itself

Neither is a capture fault — these are wrong in *their* directory.

- **Hannah Casano #39676** (page 10) — phone renders as `(917) 549-75`, two
  digits short, on both frames. Stored as null rather than invent an ending.
- **Owen Baillargeon #41010** (page 4) — email reads `oballlargeon@...`; the
  l/i is genuinely ambiguous at that resolution. Written as the form matching
  his surname and flagged. **Verify before emailing him.**
- **Alessio Cappetta #40489** (page 9) — same ambiguity, `seolcappetta@...`.

---

## How the reading works, and why partials happen

Reading a page means transcribing 50 names, emails and phone numbers off a
dozen screenshots by eye. The failure mode is **not** dropping records — it is
quietly filling a gap with something plausible. Stopping short and writing down
where is the safe move; the frames keep indefinitely in
`Ralph/EYES/harvest/page-NN`.

⚠️ **Shift+F4 does NOT archive.** Sweeps write to `EYES/live/`, which
self-deletes on a ~5-minute window. Copy to `EYES/harvest/page-NN` immediately
or the sweep is lost.

⚠️ **The live buffer also wipes on session restart, not just on the timer.**
Page 26 was swept, partially read, and then lost mid-transcription when the
session restarted — frames 7–17 were gone before they could be read. Read the
frames or copy them to `harvest/` in the SAME turn the sweep lands.

## ✅ Page 26 gap CLOSED — sequence is contiguous through 37

**Complete and contiguous through page 52 of 70 (ends Chase Rathbun).
Resume at page 53. Roster crossed 2,000 on page 37.**

### ⚠️ STATEWIDE badge on MINORS — verify before relying on it
Two cases in three pages. One would read as a CA data error; two looks like a
real category. Confirm with an assignor what a Statewide badge means on a
under-18 record before it drives any assignment logic.
- **Samuel Pedneault #38242** — 16, Wethersfield (page 49)
- **Kevin Porzycki #38236** — 15, Southington, reg through 2027 (page 51)

### Out-of-staters ALREADY IN our pools (omitted on the state rule)
If that rule is ever relaxed, start here — CA already has them working for us.
- **Benjamin Hanssen #38630** — Westerly RI, Griswold Club (page 28)
- **Kwesi Isaacs #24626** — Brooklyn NY, Griswold + NorthEast + REFS (page 31)
- **Olli Muniz #40094** — Middletown NJ, East Haddam (page 45)
- **Gianluca Palanca #40843** — Brooklyn NY, NorthEast + REFS (page 47)

⚠️ **PAGINATION DRIFT IS REAL.** CA's total moved 3472 → 3473 → 3475 during the
harvest. When the directory GROWS, rows shift one page later and you get a
harmless repeat at the page boundary (page 40 re-showed page 39's last row,
Samuel Mangler). When it SHRINKS, rows shift earlier and a page boundary
SILENTLY SKIPS people. Every page: check that the first row follows the previous
page's last row alphabetically. A forward jump means a gap — re-sweep.

### ⭐ ASSIGNORS found inside the referee directory
The harvest is turning up people who assign, not just people who officiate.
These belong on the CT assignor outreach list, not only the referee roster.
- **Joseph Maimone #887** — `joem.refassignor@gmail.com`, Statewide, Hartford,
  68, CA ID under 900, logged in 2026-08-29 (page 39)
- **Gokhan Kuruc #40095** — `coachg@vernonsoccerclub.org`, Statewide, Vernon,
  46 — club coach who also officiates (page 35)
- **Francis McGarey #1463** — `swdadmin@cjsa.org`, Statewide, Darien, 66 —
  CJSA **SouthWest District administrator**. A governing-body role address,
  not personal. Logged in 2026-08-29 (page 42)

- **Zachary Mintz #27254** — `zachary.mintz@refereeassign.onmicrosoft.com`,
  Statewide, Newington, 37. A Microsoft 365 tenant for an organisation named
  **refereeassign**. Logged in 2026-08-29 (page 43)

- **Eduardo Mozzo #973** — `sasl.assignor@gmail.com`, Bridgeport, 68.
  CA ID under 1000, logged in 2026-08-30 (page 44). "SASL" is a league
  abbreviation — identify which league before reaching out.
- **Kevin Paul #35023** — `assign@referee123.com`, Woodbridge, 52 (page 49).
  A role address on a referee-services domain, not a personal inbox.

The pattern: CA's referee directory quietly contains assignors, club coaches
and CJSA district staff. Grep future pages for `assignor`, `admin`, `cjsa`,
`district`, `refassign`/`refereeassign`, and club domains — these are outreach
contacts, not just refs. **Four found in pages 39–44 alone**, three of them on
founding-era CA IDs (#887, #973, #1463). This is a systematic seam, not luck.

### Lowest CA IDs found (founding-era accounts, all still active)
#46 Matthew Mercier (p43) · #48 Sin Hang Lai (p36) · #50 Daniel Marques (p40)

⚠️ **A sweep can report "reached the bottom" and be wrong.** The 17:33 page-35
sweep stalled — frames 7-10 were the same viewport, only ~25 of 50 rows, and no
pagination footer. ALWAYS confirm the "Page N of 70" footer is present in the
last frame before transcribing. If it is missing, the sweep is short: discard
and re-sweep, do not import a partial page.

### ⭐⭐ Refs whose HOME TOWN *is* one of our client clubs
- **Jack Nelan #895** — EAST HADDAM, in the East Haddam pool, 71 (page 46)
- **Bryce Quinn #39332** — GRISWOLD, in Griswold Club + NorthEast, 15,
  no phone on file (page 52)
- **Maci Ramcke #41287** — MOODUS (East Haddam), 13, new ref through 2027,
  logged in 2026-08-30, **in NO pool** (page 52)
- **Eli Klancko #40673** — MOODUS (East Haddam), 14, **in NO pool** (page 34)

### ⭐ Refs living INSIDE our client towns, in no pool
The harvest keeps surfacing these. They are the highest-value names in it —
local, certified, and nobody has asked them yet.
- **Eli Klancko #40673 — MOODUS** (= East Haddam), 14 (page 34)
- Elliot Kirk #40611 + Sebastian Kirk #39014 — **Glastonbury**, brothers (page 34)
- Iyeon Kim #35097 — **Glastonbury**, 18 (page 34)
- carolyn kamp #41226 — **Glastonbury**, new ref (page 33)
- Benjamin Johnson #31241 — **Glastonbury**, Statewide (page 32)
- Brady Kelleher #34389 — South Glastonbury (page 33)
- Nourddine Jalal #5523 — **Lebanon** (NECONN town), already Griswold pool (page 31)
- Oskar Heikkila #38835 — Higganum (= Haddam), East Haddam adjacent (page 29)

### Top certifications found so far
- **National** — Colby Johnson #3196, Trumbull (page 32). Highest in the harvest.
- **National AR** — Justen Lopez #34565, Stamford (page 38)
- **Regional** — Christo Jamo #30768, Woodbury (page 31) · Johnny Kassay #1415,
  Monroe (page 33) · Aidan Krok #28113, Bristol (page 35) ·
  **Collin Manuilow #33853, Woodstock — ALREADY IN Griswold + NorthEast + REFS**
  (page 40) · **Daniel Marques #50, North Haven — lowest CA ID in the harvest**
  (page 40)
- **Regional Next** — Charlie Hall #34545, Plainville (page 28)
- Statewide is common; the six above are not.

### ⭐ ALL FOUR POOLS
**Matthew Lindell #2136**, Thompson (page 38) — East Haddam + Griswold Club +
NorthEast + REFS. The only person in the harvest in all four.

### ⚠️ Apple Private Relay addresses
Masked forwarders, not real inboxes. Deliverable today, but they break if the
user changes Apple settings and replies from non-Apple senders can bounce.
- **Andrew Lord #40326** — `ktybvn7mpk@privaterelay.appleid.com` (page 38)
- **Quin Parrott #40954** — `fvwpq8rvzc@privaterelay.appleid.com` (page 48)

The page-38 prediction that more would appear held. Treat this as a growing
blast-deliverability category, not a one-off.

### "Started but never finished" registrations
A recurring CA pattern: BLANK reg year + EXPIRED badge + still tagged NEW
REFEREE. These are people who began signing up and stopped. Several logged in
recently, so they are engaged and recoverable — not dead records.
Rodriguez Iglesias #41169 · Samuel Jara #41039 · Cameron Kaiser #41058 ·
Jagger Kalman #41034

### Malformed phone numbers in CA
Stored as null rather than invented. Verify before calling.
Hannah Casano #39676 · Matthew Imperato #38001 · Kieran Keefe #37253

⚠️ CA's directory total moved 3472 → 3473 between the page-30 and page-31
sweeps. The roster is a moving target; a page swept early in a session is not
guaranteed to match the same page swept later.


Page 26 was lost once to a buffer wipe mid-transcription, re-swept at 16:49,
and imported in full. **Complete and contiguous through page 27 (ends Daniella
Hale). Resume at page 28.** The fix that made the re-sweep survive: copy the
frames to `harvest/page-NN` in the SAME turn the sweep lands, then read from
there — never read straight out of `live/`.

⚠️ **Out-of-staters are listed, never silently dropped.** Each page file has an
`_omitted_out_of_state` block naming who was left out and why, per Tod's rule
("always leave out of towners and out of staters out"). They can be pulled in
later if an assignor in that state ever comes aboard.
