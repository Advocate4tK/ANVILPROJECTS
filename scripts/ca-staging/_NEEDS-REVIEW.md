# Central Assign harvest — what's done, what's left

**Last updated: 2026-08-04**

## Status: pages 1–19 COMPLETE

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

## The one row still outstanding

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

⚠️ **Out-of-staters are listed, never silently dropped.** Each page file has an
`_omitted_out_of_state` block naming who was left out and why, per Tod's rule
("always leave out of towners and out of staters out"). They can be pulled in
later if an assignor in that state ever comes aboard.
