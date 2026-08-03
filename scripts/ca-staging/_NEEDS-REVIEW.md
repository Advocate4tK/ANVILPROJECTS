# Central Assign harvest — what's done, what's left

**Last updated: 2026-08-03**

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
