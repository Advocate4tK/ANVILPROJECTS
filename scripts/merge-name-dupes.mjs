/**
 * Merge the duplicate PEOPLE that dedupe-referees.mjs could not catch.
 *
 * That script grouped by Central Assign ID. These pairs have a CA ID on one row
 * and none on the other, because the person reached us twice by different routes:
 * once through the original roster or an availability form, once through a
 * Central Assign sweep — under a DIFFERENT email address. Jack Cotter is the
 * clean example: courtlaroo27@yahoo.com on our side, jack.cotter@rhamschools.org
 * in CA. Same kid, same town, same age, two mailboxes. The importer saw two
 * strangers and correctly refused to guess.
 *
 * ⛔ THE PAIRS DELIBERATELY LEFT ALONE — do not "finish the job" by adding these:
 *   Julio Calvao      #2899 (18) and #2900 (45), both Ansonia — FATHER AND SON
 *   Liam Baker        #3063 Storrs Mansfield 14, #3064 Weston 16 — different CA IDs
 *   Jacob Carlson     #1423 Middletown 18, #2915 Oakdale 16 — different CA IDs
 *   Aneesh Amaram     #2767 / #2768 — ONE person with TWO Central Assign accounts.
 *                     CA is the system of record; that is theirs to fix, not ours.
 *
 * RULE, same as the importer: keep the OLDEST row, fill only its BLANKS, never
 * overwrite anything already on it. Repoint every foreign key BEFORE deleting so
 * nothing is orphaned. Run without --write for a preview.
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');
const WRITE = process.argv.includes('--write');

// keep → drop. Verified one-by-one against town, age and email before listing.
const PAIRS = [
  { keep: 2397, drop: 2540, who: 'Dylan Carvalho'    },
  { keep: 2317, drop: 3246, who: 'Aaron Cherian'     },
  { keep: 2482, drop: 2589, who: 'Jack Cotter'       },
  { keep: 2495, drop: 3023, who: 'Brielle Daly'      },
  { keep: 2435, drop: 2538, who: 'Alaina Pescatello' },
  { keep: 1403, drop: 2502, who: 'Yousef Ahmed'      },
  { keep: 2491, drop: 2583, who: 'Quin Parrott'      },
  { keep: 2490, drop: 2558, who: 'Enrico Obst'       },
];

const SKIP = new Set(['id', 'created_at']);
const blank = v => v === null || v === undefined || String(v).trim() === '' || v === '[]';

const ids = PAIRS.flatMap(p => [p.keep, p.drop]);
const { data: rows, error } = await db.from('referees').select('*').in('id', ids);
if (error) { console.log('load failed:', error.message); process.exit(1); }
const byId = Object.fromEntries(rows.map(r => [r.id, r]));

// Refuse to run on anything that does not look like the pair we expect.
for (const p of PAIRS) {
  const a = byId[p.keep], b = byId[p.drop];
  if (!a || !b) { console.log(`❌ ${p.who}: #${p.keep}/#${p.drop} not both present — aborting.`); process.exit(1); }
  if (a.name.trim().toLowerCase() !== b.name.trim().toLowerCase()) {
    console.log(`❌ ${p.who}: names differ ("${a.name}" vs "${b.name}") — aborting.`); process.exit(1);
  }
}

console.log(`\n${PAIRS.length} pairs, ${rows.length} rows loaded. Keeping the older row in each.\n`);

const plan = [];
for (const p of PAIRS) {
  const keep = byId[p.keep], drop = byId[p.drop];
  const changes = {};
  for (const [k, v] of Object.entries(drop)) {
    if (SKIP.has(k)) continue;
    if (!blank(v) && blank(keep[k])) changes[k] = v;
  }

  // The whole reason these two rows exist is that the person gave us one email
  // and gave Central Assign a different one. BOTH work. Fill-blanks-only would
  // keep the survivor's address and silently bin the other — losing Jack Cotter's
  // school address, Brielle Daly's iCloud, Enrico Obst's gmail. Park the second
  // address in "Email 2" (or "Email 3") instead of destroying it.
  const other = String(drop.email || '').trim();
  const mine  = String(keep.email || '').trim().toLowerCase();
  if (other && other.toLowerCase() !== mine && !changes.email) {
    const already = [keep['Email 2'], keep['Email 3']]
      .map(x => String(x || '').trim().toLowerCase());
    if (!already.includes(other.toLowerCase())) {
      if (blank(keep['Email 2']))      changes['Email 2'] = other;
      else if (blank(keep['Email 3'])) changes['Email 3'] = other;
    }
  }
  plan.push({ ...p, changes });
  console.log(`${p.who}`);
  console.log(`   keep #${keep.id}  ${String(keep.email || '—').padEnd(34)} CA ${keep['Central Assign ID'] || '—'}`);
  console.log(`   drop #${drop.id}  ${String(drop.email || '—').padEnd(34)} CA ${drop['Central Assign ID'] || '—'}`);
  console.log(Object.keys(changes).length
    ? `   gains: ${Object.entries(changes).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(', ')}`
    : `   gains: nothing — the older row is already complete`);
  console.log();
}

// Anything pointing at a row we are about to delete has to move first.
const drops = PAIRS.map(p => p.drop);
const map = Object.fromEntries(PAIRS.map(p => [p.drop, p.keep]));
const { data: pm } = await db.from('pool_members').select('id,referee_id').in('referee_id', drops);
const { data: av } = await db.from('availability').select('id,referee_id').in('referee_id', drops);
console.log(`references to repoint — pool_members: ${(pm || []).length}, availability: ${(av || []).length}`);
(pm || []).forEach(x => console.log(`   pool_members #${x.id}: ${x.referee_id} → ${map[x.referee_id]}`));
(av || []).forEach(x => console.log(`   availability #${x.id}: ${x.referee_id} → ${map[x.referee_id]}`));

// Games store referee NAMES, not ids — both rows carry the identical name, so
// no game reference changes meaning when the copy goes.
console.log(`\ngames reference referees by NAME, and both rows share a name — nothing to repoint there.`);

if (!WRITE) {
  console.log(`\n──────── PREVIEW ONLY — nothing written. Re-run with --write. ────────`);
  process.exit(0);
}

for (const p of plan) {
  if (Object.keys(p.changes).length) {
    const { error } = await db.from('referees').update(p.changes).eq('id', p.keep);
    if (error) console.log(`  merge into #${p.keep} FAILED: ${error.message}`);
  }
}
for (const x of (pm || [])) {
  const { error } = await db.from('pool_members').update({ referee_id: map[x.referee_id] }).eq('id', x.id);
  if (error) console.log(`  pool_members #${x.id} FAILED: ${error.message}`);
}
for (const x of (av || [])) {
  const { error } = await db.from('availability').update({ referee_id: map[x.referee_id] }).eq('id', x.id);
  if (error) console.log(`  availability #${x.id} FAILED: ${error.message}`);
}
const { error: delErr } = await db.from('referees').delete().in('id', drops);
if (delErr) { console.log('delete FAILED:', delErr.message); process.exit(1); }

console.log(`\nmerged ${PAIRS.length} pairs, repointed ${(pm || []).length + (av || []).length} references, deleted ${drops.length} rows.`);
