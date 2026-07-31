// Batch importer for Central Assign sweeps.
//
//   node scripts/ca-import.mjs              -> PREVIEW ONLY, writes nothing
//   node scripts/ca-import.mjs --write      -> backs up, then writes
//
// Reads every file in scripts/ca-staging/ and reconciles against the live
// referees table. Replaces the seventeen one-off reconcile-<town>.mjs scripts.
//
// Matching order, most reliable first:
//   1. Central Assign ID  — their primary key, unambiguous
//   2. email (normalized) — near-unique in practice
//   3. name + city        — last resort, and flagged AMBIGUOUS if it hits >1
//
// NEVER overwrites a non-empty existing value. Blanks get filled; anything
// already on file is left alone. registration_year is the one exception —
// it always takes CA's value, because CA is the system of record for it.

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const WRITE   = process.argv.includes('--write');
const STAGING = path.join(import.meta.dirname, 'ca-staging');
const db = createClient('https://kaniccdqieyesezpousu.supabase.co',
                        'sb_publishable_pJX6Fsg4YrSNEhfNTHbkLA_tzFJmEUb');

// Only Regional and National are real certification grades. Everything else in
// CA's Categories column (Statewide, Male, Female, Minor, New Referee) is a tag.
function certLevel(s) {
  const tags = [s.cert_note, s.categories].flat().filter(Boolean).map(t => String(t).toLowerCase());
  if (tags.some(t => t.includes('national'))) return 'National';
  if (tags.some(t => t.includes('regional'))) return 'Regional';
  return 'Grassroots';
}

// ── Guards ────────────────────────────────────────────────────────────────────
// Central Assign's directory is not purely people. Page 1 alone held
// "CT Referee Admin", "Referee Administration" (technical@ctreferee.net) and
// "USOfficials Account" (a vendor). Imported blind they become referees, sit in
// the roster, and receive "we need refs Saturday".
const SYSTEM_DOMAINS = ['ctreferee.net', 'atelogics.com', 'ussoccer.org'];
const SYSTEM_WORDS   = /\b(admin|administration|administrator|account|test|support|technical|system)\b/i;

function isSystemAccount(s) {
  const name = (s.name || '').trim();
  if (SYSTEM_WORDS.test(name)) return 'name looks administrative';
  const dom = (s.email || '').split('@')[1];
  if (dom && SYSTEM_DOMAINS.some(d => dom.toLowerCase().endsWith(d))) return `system domain @${dom}`;
  if (name && !name.includes(' ')) return 'single-word name, not a person';
  return null;
}

// Out-of-state is a per-harvest decision, not a hardcoded rule. Skipping a
// South Salem NY result on a CT town search is right; skipping a Massachusetts
// referee during a deliberate MA harvest would defeat the point. Each staging
// file declares the state it was harvested from.
function isOutOfState(s, harvestState) {
  if (!harvestState) return null;
  const st = (s.state || '').trim().toUpperCase();
  if (st && st !== harvestState.toUpperCase()) return `${st}, harvesting ${harvestState}`;
  return null;
}

const norm      = s => (s || '').toString().trim().toLowerCase();
const normEmail = s => norm(s).replace(/\s+/g, '');
const normPhone = s => (s || '').toString().replace(/\D/g, '').replace(/^1(\d{10})$/, '$1');
const normName  = s => norm(s).replace(/[^a-z ]/g, '').replace(/\s+/g, ' ');

// ── Load staging ──────────────────────────────────────────────────────────────
if (!fs.existsSync(STAGING)) { console.log('no staging directory'); process.exit(1); }
const files = fs.readdirSync(STAGING).filter(f => f.endsWith('.json'));
if (!files.length) { console.log('no staged sweeps'); process.exit(1); }

let staged = [];   // mutated by the guard filter below
for (const f of files) {
  const blob = JSON.parse(fs.readFileSync(path.join(STAGING, f), 'utf8'));
  const rows = blob.referees || [];
  console.log(`  ${f}: ${rows.length} referees` +
              (blob._page_reported_total && blob._page_reported_total !== rows.length
                ? `  ⚠ page reported ${blob._page_reported_total}` : ''));
  staged.push(...rows.map(r => ({ ...r, _file: f, _state: blob._harvest_state || 'CT' })));
}

// ── Apply guards before anything else touches the database ────────────────────
const skipped = [];
staged = staged.filter(s => {
  const sys = isSystemAccount(s);
  if (sys) { skipped.push({ s, why: sys }); return false; }
  const oos = isOutOfState(s, s._state);
  if (oos) { skipped.push({ s, why: oos }); return false; }
  return true;
});
if (skipped.length) {
  console.log(`\n⏭  SKIPPED ${skipped.length} — not imported, listed so you can overrule:`);
  skipped.forEach(({ s, why }) => console.log(
    `   ${(s.name || '?').padEnd(28)} ${(s.email || '—').padEnd(32)} — ${why}`));
}

// ── Duplicates inside Central Assign itself (e.g. Aneesh Amaram) ─────────────
const byCaId = new Map();
const caDupes = [];
for (const r of staged) {
  const k = normName(r.name) + '|' + norm(r.city);
  if (!byCaId.has(k)) byCaId.set(k, []);
  byCaId.get(k).push(r);
}
for (const [, group] of byCaId) if (group.length > 1) caDupes.push(group);

// ── Load ours ─────────────────────────────────────────────────────────────────
const { data: ours, error } = await db.from('referees')
  // "Gender" must be selected or fill() sees undefined, treats it as blank,
  // and overwrites a gender that was already on file.
  .select('id,name,email,phone,city,state,age,"Gender","Certification Level","Central Assign ID",registration_year');
if (error) { console.log('DB error:', error.message); process.exit(1); }

const byCa    = new Map(ours.filter(r => r['Central Assign ID']).map(r => [String(r['Central Assign ID']), r]));
const byEmail = new Map(ours.filter(r => r.email).map(r => [normEmail(r.email), r]));
const byNameCity = new Map();
for (const r of ours) {
  const k = normName(r.name) + '|' + norm(r.city);
  if (!byNameCity.has(k)) byNameCity.set(k, []);
  byNameCity.get(k).push(r);
}

// ── Classify ──────────────────────────────────────────────────────────────────
const isNew = [], toUpdate = [], ambiguous = [], unchanged = [];

for (const s of staged) {
  let match = null, how = null;
  if (s.ca_id && byCa.has(String(s.ca_id)))            { match = byCa.get(String(s.ca_id)); how = 'CA id'; }
  else if (s.email && byEmail.has(normEmail(s.email))) { match = byEmail.get(normEmail(s.email)); how = 'email'; }
  else {
    const hits = byNameCity.get(normName(s.name) + '|' + norm(s.city)) || [];
    if (hits.length === 1) { match = hits[0]; how = 'name+town'; }
    else if (hits.length > 1) { ambiguous.push({ s, hits }); continue; }
  }

  if (!match) { isNew.push(s); continue; }

  // Fill blanks only. registration_year always takes CA's value.
  const changes = {};
  const fill = (col, val) => {
    if (val == null || val === '') return;
    const cur = match[col];
    if (cur == null || String(cur).trim() === '') changes[col] = val;
  };
  fill('email', s.email);
  fill('phone', normPhone(s.phone));
  fill('city',  s.city);
  fill('state', s.state);
  fill('age',   s.age);
  fill('Gender', s.gender);   // "Gender" Title Case — lowercase throws a schema error
  fill('Central Assign ID', s.ca_id);
  if (s.registration_year && match.registration_year !== s.registration_year) {
    changes.registration_year = s.registration_year;
  }

  if (Object.keys(changes).length) toUpdate.push({ s, match, how, changes });
  else unchanged.push({ s, match, how });
}

// ── Report ────────────────────────────────────────────────────────────────────
const line = '─'.repeat(74);
console.log('\n' + line);
console.log(`STAGED ${staged.length}   |   IN DB ${ours.length}`);
console.log(line);
console.log(`  NEW (would insert)      ${isNew.length}`);
console.log(`  MATCHED — fields to add ${toUpdate.length}`);
console.log(`  MATCHED — nothing to do ${unchanged.length}`);
console.log(`  AMBIGUOUS (skipped)     ${ambiguous.length}`);
console.log(`  DUPES INSIDE CA         ${caDupes.length}`);

if (caDupes.length) {
  console.log('\n⚠ Central Assign lists these people more than once:');
  caDupes.forEach(g => console.log('   ' + g.map(r =>
    `${r.name} (#${r.ca_id}, reg ${r.registration_year})`).join('   vs   ')));
}
if (ambiguous.length) {
  console.log('\n⚠ AMBIGUOUS — more than one of ours matches, skipping:');
  ambiguous.forEach(({ s, hits }) => console.log(
    `   ${s.name} (${s.city}) -> ids ${hits.map(h => h.id).join(', ')}`));
}
if (toUpdate.length) {
  console.log('\nWould UPDATE:');
  toUpdate.forEach(({ s, match, how, changes }) => console.log(
    `   #${match.id} ${match.name}  [${how}]  ${JSON.stringify(changes)}`));
}
if (isNew.length) {
  console.log('\nWould INSERT:');
  isNew.forEach(s => console.log(
    `   ${s.name.padEnd(24)} ${(s.email || 'no email').padEnd(34)} ` +
    `${String(s.age ?? '?').padStart(2)}y  reg ${s.registration_year}` +
    (s.registration_year < new Date().getFullYear() ? '  ⚠ EXPIRED' : '') +
    (s.flag ? `  — ${s.flag}` : '')));
}

const expired = staged.filter(s => s.registration_year && s.registration_year < new Date().getFullYear());
if (expired.length) {
  console.log(`\n⚠ ${expired.length} EXPIRED registration(s) — must not be assignable:`);
  expired.forEach(s => console.log(`   ${s.name} — reg ${s.registration_year}`));
}

// ── Write ─────────────────────────────────────────────────────────────────────
if (!WRITE) {
  console.log('\n' + line);
  console.log('PREVIEW ONLY — nothing written. Re-run with --write to apply.');
  console.log(line);
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join(import.meta.dirname, `backup-referees-${stamp}.json`);
fs.writeFileSync(backup, JSON.stringify(ours, null, 2));
console.log(`\nbackup written: ${path.basename(backup)} (${ours.length} rows)`);

let ins = 0, upd = 0;
for (const { match, changes } of toUpdate) {
  const { error } = await db.from('referees').update(changes).eq('id', match.id);
  if (error) console.log(`  update #${match.id} FAILED: ${error.message}`);
  else upd++;
}
for (const s of isNew) {
  const row = {
    name: s.name, email: s.email || null, phone: normPhone(s.phone) || null,
    city: s.city, state: s.state, age: s.age ?? null,
    'Gender': s.gender || null,
    'Central Assign ID': s.ca_id ?? null,
    // CA's "Categories" column mixes tags with grades. Statewide / Male /
    // Female / Minor / New Referee are TAGS, not certification levels — only
    // Regional and National are real grades, and CA is authoritative on those.
    // Writing "Statewide" into Certification Level invents a grade that does
    // not exist.
    'Certification Level': certLevel(s),
    registration_year: s.registration_year ?? null,
  };
  const { error } = await db.from('referees').insert(row);
  if (error) console.log(`  insert ${s.name} FAILED: ${error.message}`);
  else ins++;
}
console.log(`\ninserted ${ins}, updated ${upd}. Backup: ${path.basename(backup)}`);
