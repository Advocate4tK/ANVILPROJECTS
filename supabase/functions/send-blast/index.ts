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
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_KEY   = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const FROM_ADDRESS = "Referee Tool <blasts@referee-tool.com>";
const SITE         = "https://referee-tool.com";
const GAP_MS       = 550;

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
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
async function work(db: ReturnType<typeof createClient>, rows: Row[], subject: string, body: string, replyTo?: string) {
  let quotaGone = false;
  for (const row of rows) {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return json({ error: "POST only" }, 405);
  if (!RESEND_KEY) return json({ error: "RESEND_API_KEY is not set on the server" }, 500);

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
  const { data: prof } = await db.from("assignor_profiles").select("username,email").eq("id", user.id).maybeSingle();
  const senderName = prof?.username || user.email || user.id;
  const replyTo    = (prof?.email && prof.email.trim()) || user.email || undefined;

  // ── MODE 2: retry the failed rows of an existing blast ──────────────────
  if (p.retry_blast_id) {
    const blastId = Number(p.retry_blast_id);
    const { data: log } = await db.from("blast_log").select("id,subject,body").eq("id", blastId).maybeSingle();
    if (!log) return json({ error: `Blast #${blastId} not found` }, 404);
    const { data: rows } = await db.from("blast_recipients").select("id,email,is_guardian,merge").eq("blast_id", blastId).eq("status", "failed");
    if (!rows?.length) return json({ ok: true, blast_id: blastId, queued: 0, message: "Nothing failed on that blast" });
    // Flip to queued BEFORE answering, and only start the worker once the
    // flip has landed — the page's watcher polls the moment it gets this
    // response, and the first version let it see "0 queued" and call the
    // retry finished before a single email had gone.
    const { error: qErr } = await db.from("blast_recipients").update({ status: "queued", error: null }).in("id", rows.map(r => r.id));
    if (qErr) return json({ error: "Could not requeue: " + qErr.message }, 500);
    EdgeRuntime.waitUntil(work(db, rows as Row[], log.subject, log.body, replyTo));
    return json({ ok: true, blast_id: blastId, queued: rows.length, reply_to: replyTo });
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
  EdgeRuntime.waitUntil(work(db, rows as Row[], subject, body, replyTo));
  return json({ ok: true, blast_id: log.id, queued: rows.length, reply_to: replyTo });
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
