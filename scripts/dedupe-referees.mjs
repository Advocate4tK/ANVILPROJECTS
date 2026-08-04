/**
 * Repair the duplicate referees created by ca-import.mjs on 2026-08-03/04.
 *
 * CAUSE: ca-import.mjs line ~121 read the existing roster with a plain
 * .select() and no pagination. Supabase silently caps that at 1000 rows. The
 * moment the table passed 1000 during the page 5-13 backfill, the importer
 * stopped seeing the older half of the roster and re-inserted those people as
 * new. 81 referees ended up with 83 extra rows.
 *
 * RULE: keep the OLDEST row in each group. It is the one carrying pool
 * memberships, club preferences, assignor notes and history; the copies made
 * tonight are bare. Merge anything the copy has that the original lacks, move
 * any pool_members/availability references back onto the original, then delete.
 *
 * Run with --write to apply. Without it, preview only.
 */
import { createClient } from '@supabase/supabase-js';

const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');
const WRITE = process.argv.includes('--write');

// Never carried across a merge — identity and bookkeeping columns.
const SKIP = new Set(['id', 'created_at']);

async function allReferees() {
  let out = [], from = 0;
  for (;;) {
    const { data, error } = await db.from('referees').select('*').range(from, from + 999);
    if (error) throw new Error(error.message);
    if (!data || !data.length) break;
    out = out.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return out;
}

const rows = await allReferees();
console.log(`roster: ${rows.length} rows`);

// Group by Central Assign ID — the only identifier CA guarantees is unique.
const groups = new Map();
for (const r of rows) {
  const ca = r['Central Assign ID'];
  if (ca === null || ca === undefined || ca === '') continue;
  if (!groups.has(ca)) groups.set(ca, []);
  groups.get(ca).push(r);
}

const dupes = [...groups.entries()].filter(([, g]) => g.length > 1);
console.log(`duplicate groups: ${dupes.length}`);

let merges = 0, deletes = [], mergePlan = [];

for (const [ca, g] of dupes) {
  g.sort((a, b) => a.id - b.id);          // oldest first
  const keep = g[0];
  const copies = g.slice(1);

  const changes = {};
  for (const c of copies) {
    for (const [k, v] of Object.entries(c)) {
      if (SKIP.has(k)) continue;
      const has = v !== null && v !== '' && v !== undefined;
      const lacks = keep[k] === null || keep[k] === '' || keep[k] === undefined;
      // Only ever FILL a gap. Never overwrite what the original already had.
      if (has && lacks && changes[k] === undefined) changes[k] = v;
    }
    deletes.push(c.id);
  }
  if (Object.keys(changes).length) {
    merges++;
    mergePlan.push({ id: keep.id, name: keep.name, ca, changes });
  }
}

console.log(`\nkeeping ${dupes.length} originals, deleting ${deletes.length} copies`);
console.log(`originals gaining merged fields: ${merges}`);
mergePlan.forEach(m => console.log(`   #${m.id} ${m.name} (CA ${m.ca}) ← ${JSON.stringify(m.changes)}`));

// Anything still pointing at a row we're about to delete has to be moved first.
const idMap = new Map();                   // deleted id → surviving id
for (const [, g] of dupes) {
  g.sort((a, b) => a.id - b.id);
  g.slice(1).forEach(c => idMap.set(c.id, g[0].id));
}

const { data: pm } = await db.from('pool_members').select('*').in('referee_id', deletes);
const { data: av } = await db.from('availability').select('id,referee_id').in('referee_id', deletes);
console.log(`\nreferences to repoint — pool_members: ${(pm || []).length}, availability: ${(av || []).length}`);
(pm || []).forEach(p => console.log(`   pool_members #${p.id}: referee ${p.referee_id} → ${idMap.get(p.referee_id)}`));
(av || []).forEach(a => console.log(`   availability #${a.id}: referee ${a.referee_id} → ${idMap.get(a.referee_id)}`));

if (!WRITE) {
  console.log('\n──────────── PREVIEW ONLY — nothing written. Re-run with --write. ────────────');
  process.exit(0);
}

// 1. merge gaps onto the survivors
for (const m of mergePlan) {
  const { error } = await db.from('referees').update(m.changes).eq('id', m.id);
  if (error) console.log(`  merge into #${m.id} FAILED: ${error.message}`);
}
// 2. repoint references BEFORE deleting, so nothing is ever orphaned
for (const p of (pm || [])) {
  const { error } = await db.from('pool_members').update({ referee_id: idMap.get(p.referee_id) }).eq('id', p.id);
  if (error) console.log(`  pool_members #${p.id} repoint FAILED: ${error.message}`);
}
for (const a of (av || [])) {
  const { error } = await db.from('availability').update({ referee_id: idMap.get(a.referee_id) }).eq('id', a.id);
  if (error) console.log(`  availability #${a.id} repoint FAILED: ${error.message}`);
}
// 3. delete the copies, in batches
let removed = 0;
for (let i = 0; i < deletes.length; i += 50) {
  const batch = deletes.slice(i, i + 50);
  const { error } = await db.from('referees').delete().in('id', batch);
  if (error) console.log(`  delete batch FAILED: ${error.message}`);
  else removed += batch.length;
}
console.log(`\nmerged ${merges}, repointed ${(pm || []).length + (av || []).length}, deleted ${removed}`);
