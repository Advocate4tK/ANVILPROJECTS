# Central Assign harvest — what's done, what's left

**Last updated: 2026-09-07**

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

## ⭐⭐ STANDING ORDER — IMPORT EVERY PAGE, DO NOT ASK

Tod, 2026-09-07: *"Always import them. You don't have to ask me to say go. I want
these imported and we need to get them done quicker."*

Preview-then-ask is dead for this job. The cycle is: sweep → archive → transcribe
→ `--write` → verify → update this file → next page. The importer backs up before
every write and never overwrites a non-empty value, which is what makes the
standing order safe. Report the result with the word **UPLOADED**; do not stop for
approval between the preview and the write.

## ✅ Page 26 gap CLOSED — sequence is contiguous through 37

**Complete and contiguous through page 60 of 71 (ends Daniel Slone).
Resume at the first surname AFTER SLONE. Roster crossed 2,000 on page 37.

### Page 60 — UPLOADED 2026-09-08 (Jason Sheridan → Slone)
Swept 21:37, 14 frames, archived to `EYES/harvest/20260907-page60`. Footer confirmed.
The two Sheridan brothers straddle the boundary — CA sorts Adam before Jason, so page 59
ended on one and page 60 opened on the other. No gap, no repeat. 49 CT rows staged,
1 out-of-state omitted (Sinani MA — a 203 CT phone on an MA address; the STATE is the
test, not the phone). **46 inserted, 2 updated, 0 ambiguous, 0 duplicate CA IDs.
Roster 2,837 → 2,883.**
- ⭐⭐⭐ **Aliyah Simas #40174 — CANTERBURY**, 14, in **THREE POOLS** (Griswold Club +
  NorthEast + REFS). The SECOND Canterbury three-pool referee in two pages, after
  Francis Senat #5414. Canterbury is turning out to be thick with connected officials.
- ⭐⭐ **Kristen Sickle #39034** — New Haven, 33, **REGIONAL NEXT** — only the second in
  the entire harvest, after Charlie Hall #34545 (page 28). Logged in today, in no pool.
- ⭐ **Jason Sheridan #37399 — Oakdale, Griswold Club** — brother of Adam #33863 from
  page 59. Both in the same pool.
- ⭐ **Ryan Skinner #36020 — GLASTONBURY**, 18 (so assignable as an adult), no pool,
  never logged in.
- **OXFORD is a REFS pipeline.** Gavin Shupp #36957, Jaden Shupp #31672 and Massimo
  Sirgado #39667 are all Oxford and all REFS — four Oxford REFS members now across
  pages 57 and 60. Worth asking who recruited them.
- NorthEast: Mila Slattery #38560 (Rocky Hill, never logged in).
- ⚠️ **Rob Sibiga #38463** — reg 2024, EXPIRED, never logged in. Not assignable. He is
  the one CA's banner flagged, third page running that the check has matched exactly.

### ⭐ CA's EXPIRED BANNER IS A FREE COMPLETENESS CHECK — USE IT EVERY PAGE
Some pages carry a yellow banner above the table: *"N referees in this view have an
expired or missing registration year."* That N is CA counting the same rows you are
about to read. Page 57 said 2 and the read found 2; page 59 said 1 and the read found 1.
**If the count does not match what the read turns up, the read is short — re-sweep.**
It costs nothing and it catches a truncated sweep before it becomes a hole in the roster.

### Page 59 — UPLOADED 2026-09-08 (Schrade → Sheridan)
Swept 21:31, 15 frames, archived to `EYES/harvest/20260907-page59`. Footer confirmed.
48 CT rows staged, 2 out-of-state omitted (Seelenbrandt MA, Senra RI).
**40 inserted, 8 updated, 0 ambiguous, 0 duplicate CA IDs. Roster 2,797 → 2,837.**
- ⭐⭐⭐ **Francis Senat #5414 — CANTERBURY**, 58, in **THREE POOLS AT ONCE** (Griswold
  Club + NorthEast + REFS), registered through 2027, logged in today. Canterbury is
  Dave Paquette's club and we just filed their games. Only Matthew Lindell #2136
  (all four pools) is better connected in the eastern corner.
- ⭐ **Two GLASTONBURY Sherer brothers** — Aidan #39924 (14) and Harrison #34841 (17),
  same household, both in NO pool, neither has ever logged in.
- ⭐ **Jeremy Sheppard #39917** — Norwich, 14, in Griswold Club AND REFS, never logged in.
  **Adam Sheridan #33863** — Oakdale (Montville), 19, Griswold Club.
- East Haddam pool: Jaime Serrano #36757 (Clinton, 36, never logged in) and Ivan
  Shapiro #39472 (Marlborough, never logged in).
- **Ryan Schumacher #39921 — Coventry**, no pool. Third Coventry referee in three pages.
- Founding era, and two more COACH handles: **Frank Severo #786 `coachsev@aol.com`**
  (Greenwich, 60) and **Andrew Shayler #1650 `avoncoach@comcast.net`** (Avon, 71).
  Both belong on the assignor/coach outreach list, not just the roster.
- ⚠️ **Griffin Schrade #40585** — `gmschrade@optonline.COM`. Optimum's domain is normally
  optonline.NET. Transcribed as CA shows it. If it bounces, try .net.
- ⚠️ **William Shay #37528** — `shayd@guilfordschools.org`, and he lives in MADISON, a
  different district. Fourth institutional address in three pages.
- ⚠️ **James Schwab #40416** — CA tags him MINOR at 37. Their error, not ours.
- Two different RIVERSIDES on one page: Santiago Seitun #38176 is Riverside **CT**
  (a section of Greenwich) and is staged; Benjamin Senra #38611 is Riverside **RI**
  and is omitted. Read the state, not the town.

### Page 58 — UPLOADED 2026-09-08 (Sardinas → Schoonerman)
Swept 21:26, 14 frames, archived to `EYES/harvest/20260907-page58`. Footer confirmed.
⚠️ **BOUNDARY REPEAT — the harmless kind.** CA's total grew **3,543 → 3,549** between
the two sweeps, pushing every row six later, so page 58 OPENED with page 57's last six
rows (Cameron Santos → Addison Sapia), already imported and not restaged. 44 new rows
staged, **ZERO out-of-state** — only the second such page in the harvest, after page 52.
**38 inserted, 5 updated, 0 ambiguous, 0 duplicate CA IDs. Roster 2,759 → 2,797.**
- ⭐⭐ **THREE SAVOIES IN GILMAN** — and Gilman is a village in **LEBANON**, a NECONN
  town. Nicholas #39368 (47, the father) and Tyler #37459 (17) are already in the
  **Griswold Club** pool; Benjamin #40888 (14) is in none.
- ⭐ **Thomas Scagliarini #911** — Groton, 63, CA ID #911 founding era, adult in the
  **Griswold Club** pool.
- ⭐ **Schoonerman twins #40644 and #37750** — East Hampton, both 16, BOTH in the East
  Haddam pool, and NEITHER has ever logged in. Two assignable bodies nobody has reached.
- **Daniel Schneider #19922** — REGIONAL with no Statewide tag alongside it, which is
  unusual. Norwalk, logged in today, no pool.
- ⚠️ **Jeremy Scheer #801 — `jeremy.scheer@lego.com`.** LEGO's US headquarters is in
  Enfield, his own town. A corporate inbox: strict filters, and it dies with the job.
  Third institutional address in three pages (after @uscg.mil and @my.npsct.org) —
  this is a category now, not a curiosity. **Johnny Scafidi #39047** is on
  `aya.yale.edu`, a Yale alumni FORWARDER, where a failure will not look like a bounce.
- Families everywhere: three Schimmecks in New Canaan (Ryan and Tyler are twins), two
  Schaefers in New Fairfield, two Schermers in Ridgefield, two Schleifs in West
  Hartford, two Schlossers in New Fairfield, two Scafidis in Guilford.
THE R's ARE DONE — the harvest is into the S's, the biggest letter left.**

### Page 57 — UPLOADED 2026-09-07 (Sadlosky → Sapia)
Swept 15:54, 14 frames, archived to `EYES/harvest/20260907-page57`. Footer confirmed.
46 CT rows staged, 4 out-of-state omitted (Safran NY, Samchalk NY, Samour MA,
Sanchez MA). **34 inserted, 9 updated, 0 ambiguous, 0 duplicate CA IDs.
Roster 2,725 → 2,759.**
- ⭐⭐ **Madison San Souci #40253 — MOOSUP**, 14, in NO pool. Moosup is Plainfield —
  Dave Hurteau's town. First Moosup referee in the harvest.
- ⭐⭐ **Kiran Sandiford #37523 — STORRS**, 29, **REGIONAL**, handle `sandifordreferee`,
  in no pool. NECONN territory and a serious official. Best NECONN name on the page.
- **Charles Sanchez #38511** — Meriden, 21, REGIONAL, logged in today, no pool.
- East Haddam pool: John Salafia #35206 (East Hampton) and Addison Sapia #39646
  (Old Lyme). joseph salafia #41094 is John's sibling and is NOT in the pool.
- REFS pool: Jose Joaquin Sanchez #19080 (59, Oxford) and Brynn Samorajczyk #40910
  (13, Oxford). NorthEast: Emma Santos #40341 (Rocky Hill, no phone, never logged in).
- ⚠️ **Two expired/incomplete, and CA said so first.** The page carried CA's own banner
  "2 referees in this view have an expired or missing registration year" and both were
  found in the read — **Britta Salomonsson #41336** (blank reg + Expired + still tagged
  New Referee, never logged in) and **Carmine Santaniello #39683** (reg 2025, expired).
  That banner is a free completeness check on every future page: if the count in the
  banner does not match what the read turns up, the read is short. USE IT.
  Santaniello shares a phone with his son Evan #39245, who is current.
- ⚠️ **Cameron Santos #39021** — `csantos85549@my.npsct.org`, a Newington Public Schools
  STUDENT account. District mail blocks outside senders and the account dies at
  graduation. Second institutional address in two pages after Caden Rust's @uscg.mil.

### Page 56 — UPLOADED 2026-09-07 (Rorick → Sadanowicz)
Swept 15:50, 14 frames, archived to `EYES/harvest/20260907-page56`. Footer confirmed.
Follows page 55 correctly — Roraback precedes Rorick. 48 CT rows staged, 2 out-of-state
omitted (Roseman NJ, Rueda NJ). **41 inserted, 6 updated, 0 ambiguous, 0 duplicate
CA IDs. Roster 2,684 → 2,725.**
- ⭐⭐ **James Russo #1547 — LEBANON**, 71, CA ID #1547, in BOTH East Haddam and
  Griswold pools, logged in yesterday. Only the second Lebanon referee found, after
  Nourddine Jalal #5523 (page 31).
- ⭐ **Two COVENTRY referees in no pool** — Matthew Rouillard #38112 (15) and
  aerie rowett #37287 (17). NECONN territory.
- ⚠️ **Caden Rust #40034 — `ashley.a.rust@uscg.mil`**, a US Coast Guard address, and
  he is IN the East Haddam pool. Military domains commonly reject outside bulk mail;
  a blast to him may fail silently. First .mil address in the harvest.
- **Juan Rumino #909** — 82 years old, CA #909, East Haven, and the only referee in
  the harvest on his OWN DOMAIN (`juan@rumino.com`). Logged in this week.
- **Regional badges**: Jeffrey Ruiz #32353 (Fairfield, handle `ruizreferee`, 23) and
  Adrian Rusu #795 (Monroe, 53). Alex Rusu #19462 is REGIONAL CANDIDATE, not Regional —
  the importer correctly leaves him Grassroots.
- Also East Haddam pool: Jackson Rurka #34644 (East Hampton), Maxwell Sabourin #39380
  (Marlborough, never logged in).
- Families: three Rusus in Monroe, three Rosens in Greenwich, two Rosses in Brookfield,
  two Ruskins in Stratford, two Roths in South Windsor.
- **Hector Rueda #39035 (Roselle Park NJ)** carries a NATIONAL CANDIDATE badge — the
  highest credential seen on the page, and omitted on the state rule. He belongs on the
  out-of-staters-already-in-CA list if that rule is ever relaxed.

### Page 55 — UPLOADED 2026-09-07 (Riviere Jr → Roraback)
Swept 15:29, 14 frames, archived to `EYES/harvest/20260907-page55`. Footer confirmed.
Follows page 54 correctly — Rivera precedes Riviere, no gap and no boundary repeat.
46 CT rows staged, 4 out-of-state omitted (Rizo CA, Roach NY, Robbertz CO,
Rodriguez NY). **39 inserted, 6 updated, 0 ambiguous, 0 duplicate CA IDs.
Roster 2,645 → 2,684.**
- ⭐⭐ **Kevin Robidoux #41021 — EAST HADDAM**, 14, already in the East Haddam pool.
  THIRD referee whose home town is one of our client clubs (after Jack Nelan #895
  and Bryce Quinn #39332).
- ⭐ **Two GLASTONBURY residents in no pool**: Logan Rodriguez #37572 (16) and
  Daniel Rooney #5641 (64, founding-era ID).
- ⭐ **Four NECONN-town referees, none in a pool**: David Rodriguez #41100 (37,
  Willimantic, ADULT new referee) · Zayden Rodriguez #41355 (13, Willimantic) ·
  Julio Roger #39922 + Julio Roger Jr #39567 (South Windham, father and son) ·
  Gianni Romeo #19336 (Storrs Mansfield).
- **William Riviere Jr #1538 — 83 years old**, CA #1538, still registered for 2026.
  Oldest referee found in the whole harvest.
- **Jaime Rodrigues #29609** — `jrodrigues@bridgeportedu.net`, a Bridgeport Public
  Schools address. Same seam as the assignors found in pages 39-49: work inboxes in
  the referee directory are outreach contacts, not just officials.
- Families: three Roods in Tolland (father 46 + two sons), Rodon twins in Fairfield
  on consecutive IDs, Robles Castro brothers in Stratford, Robidoux siblings in
  Bristol (Kevin in East Haddam is a DIFFERENT family).
- ⚠️ **David Rodrigues #5283** — `d11rod1787@gmail.com`. Read as digit ones at 150%
  but d-l-l is possible. VERIFY BEFORE EMAILING.
- ⚠️ **Alyssa Robidoux #40065** — `alyssa1gk@gmail.com` is a DIGIT ONE, not an L.

### Page 54 — UPLOADED 2026-09-07 (Ratnavel → Rivera-anglero)
Swept 15:11, 14 frames, archived to `EYES/harvest/20260907-page54`. Footer confirmed.
Rows 1-4 (Ranjan, Ranta, Raposa, Rathbun) were page 52's tail and were NOT restaged.
41 CT rows staged, 5 out-of-state omitted (Reale MA, Reed NY, Reeves MS, Regan MA,
Rice CO). **36 inserted, 3 updated, 0 ambiguous, 0 duplicate CA IDs. Roster 2,609 →
2,645.** CA's directory total is now **3,543** (3,478 on page 52 — still growing).
- **Matthew Rindfleisch #40116 — HIGGANUM** (= Haddam, next door to East Haddam), 14,
  in NO pool. Second Higganum find after Oskar Heikkila #38835.
- **Trevor Reid #39371** — 40, Colchester, an ADULT in BOTH East Haddam and Griswold
  pools, never logged in. Maximus Reinholtz #39930 (Colchester) and Orlando
  Rivera-anglero #29271 (Middletown) are also East Haddam pool, and all three were
  gap-fills — already on our roster, now carrying their CA IDs.
- **Dustin Reep #41030** — 49, Northford, brand-new referee through 2027, logged in
  the same day. Adult entrants are rare; worth reaching.
- ⚠️ **Collin Raymond #39431** — `luckyal8@hotmail.com`. Lowercase L before the 8,
  read at 150%. VERIFY BEFORE EMAILING.
- Recchi #38873 and Regnier #38947 also sit in `enfield.json` from the town harvest,
  a year younger. Same CA IDs, same person — a cross-file repeat, not a CA duplicate.
  The importer's "DUPES INSIDE CA" counter includes these; it is not all CA's fault.

### Page 53 — no file, and that is correct
Swept and checked 2026-09-07: every row (Pudipeddi → Ranieri) was already in the
roster from page 52's sweep. Pagination drift, not a gap. Nothing staged.

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
