// Auto-archive stale referees.
//
//   node scripts/auto-archive.mjs           -> PREVIEW ONLY
//   node scripts/auto-archive.mjs --write   -> backs up, then archives
//
// Archiving is reversible and keeps all history. It is NOT deletion. A referee
// who comes back through the availability form is auto-restored by
// referee-availability-form.html — see the auto-restore block in runEmailLookup.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE RULE THAT MATTERS MOST IS THE ONE ABOUT MISSING DATA.
//
// "No activity in N years" must mean HAD activity, and it was N or more years
// ago. It must never mean "we have no record of them". Most of the 623 referees
// have no availability row at all -- including the 39 Enfield records imported
// on 2026-07-30 -- and a naive rule would archive nearly the whole roster on
// its first run. Absence of data is not evidence of absence.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const WRITE = process.argv.includes('--write');
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

const NOW           = new Date();
const YEAR          = NOW.getFullYear();
const LAPSED_YEARS  = 3;   // registration this far behind == almost certainly gone
const INACTIVE_YEARS = 5;  // no availability in this long == gone

const { data: refs, error } = await db.from('referees')
  .select('id,name,city,status,registration_year');
if (error) { console.log('DB error:', error.message); process.exit(1); }

const { data: avail, error: e2 } = await db.from('availability')
  .select('"Referee Name",created_at');
if (e2) { console.log('availability error:', e2.message); process.exit(1); }

// Most recent availability submission per referee name.
const lastSeen = new Map();
for (const a of avail || []) {
  const k = (a['Referee Name'] || '').trim().toLowerCase();
  if (!k) continue;
  const t = new Date(a.created_at).getTime();
  if (!lastSeen.has(k) || t > lastSeen.get(k)) lastSeen.set(k, t);
}

const isArchived = r => String(r.status || '').toLowerCase() === 'archived';
const active = refs.filter(r => !isArchived(r));

// ── Rule 1: registration lapsed LAPSED_YEARS or more ─────────────────────────
// Works today, and only ever fires on referees we have real data for.
const rule1 = active.filter(r =>
  r.registration_year != null && Number(r.registration_year) <= YEAR - LAPSED_YEARS);

// ── Rule 2: had availability, and it was INACTIVE_YEARS or more ago ──────────
// Correct now, dormant for years: this system's availability data begins in
// 2026, so nothing can be five years stale until 2031. Written now so it starts
// working on its own rather than being remembered later.
const cutoff = new Date(NOW); cutoff.setFullYear(YEAR - INACTIVE_YEARS);
const rule2 = active.filter(r => {
  const t = lastSeen.get((r.name || '').trim().toLowerCase());
  return t != null && t < cutoff.getTime();     // note: null means NEVER, and never is not stale
});

const targets = [...new Map([...rule1, ...rule2].map(r => [r.id, r])).values()];

// ── Report ────────────────────────────────────────────────────────────────────
const line = '─'.repeat(72);
console.log(line);
console.log(`referees ${refs.length}  |  active ${active.length}  |  already archived ${refs.length - active.length}`);
console.log(line);
console.log(`Rule 1 — registration lapsed ${LAPSED_YEARS}+ yrs (<= ${YEAR - LAPSED_YEARS}) : ${rule1.length}`);
console.log(`Rule 2 — no availability in ${INACTIVE_YEARS}+ yrs (had some before)  : ${rule2.length}`);
console.log(`Would archive (deduped)                                : ${targets.length}`);

const neverActive = active.filter(r => !lastSeen.has((r.name || '').trim().toLowerCase()));
console.log(`\nReferees with NO availability on record: ${neverActive.length}`);
console.log('  These are deliberately NOT archived. No record is not the same as');
console.log('  no activity — most were imported from Central Assign and have simply');
console.log('  never been asked yet.');

if (targets.length) {
  console.log('\nWould archive:');
  targets.forEach(r => {
    const why = [];
    if (rule1.includes(r)) why.push(`registration ${r.registration_year}`);
    if (rule2.includes(r)) {
      const t = lastSeen.get((r.name || '').trim().toLowerCase());
      why.push(`last availability ${new Date(t).toISOString().slice(0, 10)}`);
    }
    console.log(`   #${String(r.id).padEnd(5)} ${(r.name || '').padEnd(26)} ${(r.city || '—').padEnd(16)} ${why.join(' · ')}`);
  });
}

if (!WRITE) {
  console.log('\n' + line);
  console.log('PREVIEW ONLY — nothing changed. Re-run with --write to archive.');
  console.log(line);
  process.exit(0);
}
if (!targets.length) { console.log('\nNothing to archive.'); process.exit(0); }

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join(import.meta.dirname, `backup-archive-${stamp}.json`);
fs.writeFileSync(backup, JSON.stringify(targets, null, 2));
console.log(`\nbackup written: ${path.basename(backup)}`);

let n = 0;
for (const r of targets) {
  const { error } = await db.from('referees').update({ status: 'Archived' }).eq('id', r.id);
  if (error) console.log(`  #${r.id} FAILED: ${error.message}`);
  else n++;
}
console.log(`archived ${n}. Any of them can walk back in through the availability form and be restored automatically.`);
