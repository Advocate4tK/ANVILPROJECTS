// ═══════════════════════════════════════════════════════════════════════════
// send-blast — the pipe behind the Send button on referee-blasts.html
// 2026-09-16, rebuilt the same afternoon
//
// WHY THIS IS A SERVER FUNCTION AND NOT PAGE CODE
//   The Resend API key can never sit in the repo — the repo is public. It
//   lives in a Supabase secret (RESEND_API_KEY) and only this function can
//   read it.
//
// WHY IT RETURNS BEFORE IT HAS FINISHED SENDING
//   The first version sent every address inside the request and answered
//   when done. For two people that is a second. The first real blast was 202
//   addresses — two minutes at Resend's rate — and the gateway gave up at 60s
//   with a 504. The function kept running and 146 went out, while the page
//   told Tod "Didn't send". The worst possible message, and it was false.
//
//   Now: verify the caller, write blast_log + one blast_recipients row per
//   address (all 'queued'), and RETURN the blast id immediately. The sending
//   happens after the response, inside EdgeRuntime.waitUntil, updating each
//   row as it lands. The page watches those rows. There is nothing left for
//   a gateway to time out, and the number on screen is always the real one.
//
// WHY PER-RECIPIENT AND NOT ONE BCC
//   The composer's merge tokens ({{first}}, {{name}}, {{town}}) only work if
//   each person gets their own message. That is also what makes the
//   unsubscribe link per-person.
//
// TWO MODES
//   { recipients, subject, body, ... }   a new blast
//   { retry_blast_id }                   re-send every 'failed' row of an
//                                        existing blast, using the subject
//                                        and body stored in blast_log
//
// RATE
//   Resend allows 2 requests/second. ~550ms between sends. 202 addresses ≈
//   two minutes. Slow is fine.
//
// WHY THE WORKER HANDS OFF TO ITSELF (2026-09-18)
//   waitUntil keeps the isolate alive after the response, but not forever:
//   Supabase kills an Edge Function at 400s of wall clock. A 493-address
//   blast is ~7½ minutes. It died at 266 — the other 227 sat at 'queued'
//   and the page said "Sending 266 / 493" for hours, because nothing on
//   either side knew the worker was gone.
//
//   Now the worker watches its own clock. When it has used HOP_BUDGET_MS it
//   stops, POSTs to its own URL with { resume_blast_id } (authenticated by
//   the service key in x-blast-hop, so a login that expires mid-blast can't
//   strand it), and exits. The fresh isolate picks up whatever is still
//   'queued' on that blast and carries on. A blast of any size is a chain
//   of short hops, and if a hop ever does die, the page notices the count
//   stop moving and offers Resume — same resume path, only 'queued' and
//   'failed' rows are touched, so nobody is ever sent twice.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_KEY   = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const FROM_ADDRESS = "Referee Tool <blasts@referee-tool.com>";
const SITE         = "https://referee-tool.com";
const GAP_MS       = 550;
const HOP_BUDGET_MS = 150_000;   // stop and hand off well inside the 400s wall clock

// ── SMS via Twilio — same gate and same helper shape as notify-assignor ────
const TW_SID  = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TW_TOK  = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
const TW_FROM = Deno.env.get("TWILIO_FROM") ?? "";
const smsReady = () => !!(TW_SID && TW_TOK && TW_FROM);
const e164 = (p: unknown) => { const d = String(p ?? "").replace(/\D/g, ""); return d.length === 10 ? "+1" + d : (d.length === 11 && d.startsWith("1")) ? "+" + d : ""; };
async function sendSms(to: string, body: string): Promise<{ ok: boolean; sid?: string; error?: string }> {
  if (!smsReady()) return { ok: false, error: "SMS not configured (Twilio secrets missing)" };
  const num = e164(to); if (!num) return { ok: false, error: `bad phone "${to}"` };
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TW_SID}/Messages.json`, {
    method: "POST",
    headers: { "Authorization": "Basic " + btoa(`${TW_SID}:${TW_TOK}`), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: TW_FROM, To: num, Body: body }),
  });
  const j = await r.json().catch(() => ({}));
  return r.ok ? { ok: true, sid: j?.sid } : { ok: false, error: j?.message || `Twilio ${r.status}` };
}

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-blast-hop",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Recipient = {
  referee_id:   number | null;
  name:         string;
  email:        string;
  town?:        string;
  token?:       string | null;
  is_guardian?: boolean;
  minor_name?:  string;
};

// What a blast_recipients row has to carry so a retry can rebuild the merge
// without the page re-sending the list. name/town/token/minor_name live in
// the row's `merge` json column.
type Row = {
  id: number; email: string; is_guardian: boolean;
  merge: { name?: string; town?: string; token?: string | null; minor_name?: string } | null;
};

// ── merge tokens, identical to mergeFor() on the page ─────────────────────
function merge(text: string, r: Recipient): string {
  const full  = (r.name || "").trim();
  const first = full.split(/\s+/)[0] || "there";
  return String(text)
    .replace(/\{\{\s*first\s*\}\}/gi, first)
    .replace(/\{\{\s*name\s*\}\}/gi,  full || "there")
    .replace(/\{\{\s*town\s*\}\}/gi,  r.town || "your area");
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toHtml(body: string, footer: string): string {
  const paras = esc(body).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:640px">
${paras}
<hr style="border:none;border-top:1px solid #ddd;margin:24px 0 12px">
<p style="font-size:12px;color:#777">${footer}</p>
</div>`;
}

function footerFor(r: Recipient): { text: string; html: string } {
  const unsub = r.token ? `${SITE}/unsubscribe.html?t=${r.token}` : "";
  const who   = r.is_guardian && r.minor_name
    ? `You are receiving this because you are listed as the parent or guardian of ${r.minor_name}, a registered referee.`
    : `You are receiving this because you are a registered referee in Connecticut.`;
  return {
    text: unsub ? `${who}\nTo stop receiving these emails: ${unsub}` : who,
    html: unsub ? `${esc(who)}<br><a href="${unsub}" style="color:#777">Unsubscribe</a>` : esc(who),
  };
}

// A bad address is the referee record's fault, not Resend's. Catch it here so
// the error says so, instead of Resend's generic "Invalid `to` field".
const EMAIL_OK = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;

async function sendOne(r: Recipient, subject: string, body: string, replyTo?: string) {
  const to = (r.email || "").trim();
  if (!EMAIL_OK.test(to)) throw new Error(`bad address on the referee record: "${to}"`);
  const foot = footerFor(r);
  // A send that hangs would pin the isolate until its wall clock kills it —
  // and take the hop chain down with it. 20s is generous for Resend.
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(20000),
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from:     FROM_ADDRESS,
      to:       [to],
      reply_to: replyTo || undefined,
      subject:  merge(subject, r),
      text:     merge(body, r) + "\n\n--\n" + foot.text,
      html:     toHtml(merge(body, r), foot.html),
      headers:  r.token ? { "List-Unsubscribe": `<${SITE}/unsubscribe.html?t=${r.token}>` } : undefined,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Resend ${res.status}`);
  return json?.id as string | undefined;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── the background worker ─────────────────────────────────────────────────
// Walks every row handed to it, sends, and updates the row. If Resend says
// the daily quota is gone, every remaining row is marked failed with that
// reason at once — no point burning two minutes finding out 56 times.
async function work(db: ReturnType<typeof createClient>, blastId: number, rows: Row[], subject: string, body: string, replyTo?: string) {
  let quotaGone = false;
  const started = Date.now();
  let done = 0;
  for (const row of rows) {
    if (!quotaGone && done > 0 && Date.now() - started > HOP_BUDGET_MS) {
      // Out of time for this isolate. Hand the rest to a fresh one.
      await hop(blastId, done, rows.length);
      return;
    }
    done++;
    if (quotaGone) {
      await db.from("blast_recipients").update({ status: "failed", error: "daily sending quota reached — retry after it resets" }).eq("id", row.id);
      continue;
    }
    const r: Recipient = {
      referee_id: null, email: row.email, is_guardian: row.is_guardian,
      name: row.merge?.name || "", town: row.merge?.town || "",
      token: row.merge?.token ?? null, minor_name: row.merge?.minor_name || "",
    };
    try {
      const pid = await sendOne(r, subject, body, replyTo);
      await db.from("blast_recipients").update({ status: "sent", provider_id: pid ?? null, error: null }).eq("id", row.id);
    } catch (e) {
      const msg = (e as Error).message || String(e);
      if (/quota/i.test(msg)) quotaGone = true;
      await db.from("blast_recipients").update({ status: "failed", error: msg }).eq("id", row.id);
    }
    await sleep(GAP_MS);
  }
}

// Start a new invocation of this same function to continue a blast. The
// service key in x-blast-hop is the credential — only this function has it.
// The fetch is awaited so the request is actually on the wire before this
// isolate exits; the callee answers in about a second (it starts its own
// worker and returns), so this never comes near the wall clock.
async function hop(blastId: number, done: number, of: number) {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/send-blast`, {
      method: "POST",
      headers: { "x-blast-hop": SERVICE_KEY, "apikey": ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ resume_blast_id: blastId, after: done, of }),
    });
    if (!r.ok) console.error(`[send-blast] hop for blast ${blastId} refused: ${r.status} ${await r.text().catch(() => "")}`);
  } catch (e) {
    console.error(`[send-blast] hop for blast ${blastId} failed:`, (e as Error).message || e);
  }
}

// Reply-to for a blast: the sender's ASSIGNOR address, looked up server-side.
async function replyToFor(db: ReturnType<typeof createClient>, userId: string, fallback?: string | null) {
  const { data: prof } = await db.from("assignor_profiles").select("username,email,reply_to_email").eq("id", userId).maybeSingle();
  return {
    senderName: prof?.username || fallback || userId,
    replyTo:    (prof?.reply_to_email && prof.reply_to_email.trim())
             || (prof?.email && prof.email.trim())
             || fallback || undefined,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return json({ error: "POST only" }, 405);
  if (!RESEND_KEY) return json({ error: "RESEND_API_KEY is not set on the server" }, 500);

  // ── MODE 0: a hop from a previous isolate of this function ──────────────
  // No user JWT — the service key in x-blast-hop is the proof. Picks up
  // every row still 'queued' on the blast and keeps going.
  const hopKey = req.headers.get("x-blast-hop") || "";
  if (hopKey) {
    if (!SERVICE_KEY || hopKey !== SERVICE_KEY) return json({ error: "Bad hop key" }, 401);
    let hp: any;
    try { hp = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
    const blastId = Number(hp.resume_blast_id);
    if (!blastId) return json({ error: "resume_blast_id required" }, 400);
    const db = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: log } = await db.from("blast_log").select("id,subject,body,sent_by").eq("id", blastId).maybeSingle();
    if (!log) return json({ error: `Blast #${blastId} not found` }, 404);
    const { data: rows } = await db.from("blast_recipients").select("id,email,is_guardian,merge").eq("blast_id", blastId).eq("status", "queued").order("id");
    if (!rows?.length) return json({ ok: true, blast_id: blastId, queued: 0, message: "Nothing left to send" });
    const { replyTo } = await replyToFor(db, log.sent_by);
    EdgeRuntime.waitUntil(work(db, blastId, rows as Row[], log.subject, log.body, replyTo));
    return json({ ok: true, blast_id: blastId, queued: rows.length, hop: true });
  }

  // ── who is calling ───────────────────────────────────────────────────────
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Not signed in" }, 401);
  const asUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
  const { data: { user }, error: uErr } = await asUser.auth.getUser();
  if (uErr || !user) return json({ error: "Not signed in" }, 401);

  let p: any;
  try { p = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }

  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  // ── who replies go to ────────────────────────────────────────────────────
  // The assignor's ASSIGNOR address — assignor_profiles.email — never the
  // login. Tod logs in as tsmith but replies belong at nectassignor@gmail.com;
  // Eric is ebaughman and replies belong at ct.ref.assignor@gmail.com. The
  // page does not get to pass this in; it is looked up server-side from the
  // verified caller, so it cannot be wrong or spoofed.
  // Tod, 2026-09-16: "replies should NOT go to todlsmith@gmail.com but to
  // whichever assignor sent the blast.... and their respective assignor email."
  // reply_to_email wins when set; email otherwise. Tod blasts as `admin`,
  // whose account address is refassignor398@ — but replies belong at
  // nectassignor@. The two addresses are different things and coincided for
  // everyone else by luck. See sql/assignor-reply-to.sql.
  const { senderName, replyTo } = await replyToFor(db, user.id, user.email);

  // ── MODE 2: retry / resume an existing blast ────────────────────────────
  // 'failed' rows are re-sent. 'queued' rows are picked up too — that is
  // what a dead worker leaves behind, and the page's Resume button lands
  // here. 'sent' rows are never touched.
  if (p.retry_blast_id) {
    const blastId = Number(p.retry_blast_id);
    const { data: log } = await db.from("blast_log").select("id,subject,body").eq("id", blastId).maybeSingle();
    if (!log) return json({ error: `Blast #${blastId} not found` }, 404);
    const { data: rows } = await db.from("blast_recipients").select("id,email,is_guardian,merge").eq("blast_id", blastId).in("status", ["failed", "queued"]).order("id");
    if (!rows?.length) return json({ ok: true, blast_id: blastId, queued: 0, message: "Nothing failed or waiting on that blast" });
    // Flip to queued BEFORE answering, and only start the worker once the
    // flip has landed — the page's watcher polls the moment it gets this
    // response, and the first version let it see "0 queued" and call the
    // retry finished before a single email had gone.
    const { error: qErr } = await db.from("blast_recipients").update({ status: "queued", error: null }).in("id", rows.map(r => r.id));
    if (qErr) return json({ error: "Could not requeue: " + qErr.message }, 500);
    EdgeRuntime.waitUntil(work(db, blastId, rows as Row[], log.subject, log.body, replyTo));
    return json({ ok: true, blast_id: blastId, queued: rows.length, reply_to: replyTo });
  }

  // ── MODE 3: an SMS blast ────────────────────────────────────────────────
  // { channel: "sms", body, recipients: [{referee_id, name, phone, is_guardian}] }
  // The page only hands over people whose consent is on file, but the
  // server checks again — a page is not a gate. Every attempt is logged to
  // sms_log. Without Twilio secrets every row is 'skipped' with the reason,
  // and the response says so plainly: nothing pretends to have texted.
  if (p.channel === "sms") {
    const body = String(p.body || "").trim();
    const recips = Array.isArray(p.recipients) ? p.recipients.filter((r: any) => r && r.phone) : [];
    if (!body)          return json({ error: "Message is empty" }, 400);
    if (!recips.length) return json({ error: "No recipients" }, 400);
    if (recips.length > 2000) return json({ error: "Too many (max 2000)" }, 400);

    // Re-verify consent server-side against the referee rows.
    const ids = [...new Set(recips.map((r: any) => Number(r.referee_id)).filter(Boolean))];
    const { data: rows } = await db.from("referees").select('id,age,phone,"Guardian Phone",sms_consent_at,guardian_sms_consent_at').in("id", ids);
    const byId = new Map((rows || []).map(r => [r.id, r]));
    const allowed = recips.filter((r: any) => {
      const row = byId.get(Number(r.referee_id)); if (!row) return false;
      return r.is_guardian ? !!(row.guardian_sms_consent_at && row.age != null && Number(row.age) < 18) : !!row.sms_consent_at;
    });
    const refused = recips.length - allowed.length;

    const { data: log } = await db.from("blast_log").insert({
      sent_by: user.id, sent_by_name: senderName, subject: "(text)", body,
      where_text: (p.where_text ? p.where_text + " · " : "") + "SMS", recipient_count: allowed.length, guardians_cc: true,
    }).select("id").single();

    let sent = 0, failed = 0, skipped = 0; const failures: { phone: string; error: string }[] = [];
    for (const r of allowed) {
      const res = await sendSms(r.phone, body);
      const status = res.ok ? "sent" : (res.error?.includes("not configured") ? "skipped" : "failed");
      if (status === "sent") sent++; else if (status === "skipped") skipped++; else { failed++; failures.push({ phone: e164(r.phone) || r.phone, error: res.error || "?" }); }
      await db.from("sms_log").insert({
        sent_by: user.id, sent_by_name: senderName, kind: "blast", blast_id: log?.id ?? null, referee_id: r.referee_id ?? null,
        to_phone: e164(r.phone) || String(r.phone), is_guardian: !!r.is_guardian, body, status, provider_id: res.sid ?? null, error: res.ok ? null : res.error,
      });
      await sleep(200);
    }
    const note = !smsReady() ? "Texting isn't switched on yet — Twilio isn't configured. Every message was logged as skipped; nothing was sent."
               : refused ? `${refused} were refused by the server: no consent on file.` : "";
    return json({ ok: true, blast_id: log?.id, channel: "sms", sent, failed, skipped, refused, failures, sms_ready: smsReady(), note });
  }

  // ── MODE 1: a new blast ─────────────────────────────────────────────────
  const subject = (p.subject || "").trim();
  const body    = (p.body    || "").trim();
  const recips: Recipient[] = Array.isArray(p.recipients) ? p.recipients.filter((r: Recipient) => r && r.email) : [];
  if (!subject)       return json({ error: "Subject is empty" }, 400);
  if (!body)          return json({ error: "Message is empty" }, 400);
  if (!recips.length) return json({ error: "No recipients" }, 400);
  if (recips.length > 5000) return json({ error: "Too many recipients in one blast (max 5000)" }, 400);

  const { data: log, error: lErr } = await db.from("blast_log").insert({
    sent_by: user.id, sent_by_name: senderName, subject, body,
    where_text: p.where_text || null, recipient_count: recips.length, guardians_cc: true,
  }).select("id").single();
  if (lErr || !log) return json({ error: "Could not write blast_log: " + (lErr?.message || "?") }, 500);

  const { data: rows, error: rErr } = await db.from("blast_recipients").insert(
    recips.map(r => ({
      blast_id: log.id, referee_id: r.referee_id ?? null, email: r.email.trim(),
      is_guardian: !!r.is_guardian,
      merge: { name: r.name || "", town: r.town || "", token: r.token ?? null, minor_name: r.minor_name || "" },
    }))
  ).select("id,email,is_guardian,merge");
  if (rErr || !rows) return json({ error: "Could not write blast_recipients: " + (rErr?.message || "?") }, 500);

  // Answer NOW. The sending runs on after this response has gone out.
  EdgeRuntime.waitUntil(work(db, log.id, rows as Row[], subject, body, replyTo));
  return json({ ok: true, blast_id: log.id, queued: rows.length, reply_to: replyTo });
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
