// ═══════════════════════════════════════════════════════════════════════════
// send-blast — the pipe behind the Send button on referee-blasts.html
// 2026-09-16
//
// WHY THIS IS A SERVER FUNCTION AND NOT PAGE CODE
//   The Resend API key can never sit in the repo — the repo is public. It
//   lives in a Supabase secret (RESEND_API_KEY) and only this function can
//   read it. The page sends recipients + message; this function does the
//   sending and writes the record.
//
// WHY PER-RECIPIENT AND NOT ONE BCC
//   The composer's merge tokens ({{first}}, {{name}}, {{town}}) only work if
//   each person gets their own message. That is also what makes the
//   unsubscribe link per-person. The old "Copy BCC List" button could never
//   do either — that is why it warned the tokens go out raw.
//
// WHO MAY CALL IT
//   Anyone who sends a valid Supabase user JWT — i.e. a logged-in assignor.
//   The JWT is verified against auth.getUser() before a single row is written.
//   An anon key alone is refused. Guardians and referees never call this.
//
// WHAT IT WRITES
//   blast_log        one row, up front, status of the whole send
//   blast_recipients one row per address, updated as each send resolves
//   Both with the service role, which bypasses RLS — the page could not
//   write outcomes itself and should not be able to.
//
// RATE
//   Resend's default is 2 requests/second. This sends one at a time with a
//   ~550ms gap. A 300-person blast takes about three minutes. Slow is fine;
//   a 429 mid-blast that strands half the pool at 'queued' is not.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_KEY   = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Where the mail comes from. The domain is verified in Resend; the local part
// is ours to choose. reply-to is the sending assignor so answers land with a
// human, not in a mailbox nobody reads.
const FROM_ADDRESS = "Referee Tool <blasts@referee-tool.com>";
const SITE         = "https://referee-tool.com";
const GAP_MS       = 550;

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Recipient = {
  referee_id:  number | null;
  name:        string;
  email:       string;
  town?:       string;
  token?:      string;      // unsubscribe_token
  is_guardian?: boolean;    // a parent copy — no merge of the child's first name into "Hi {{first}}"
  minor_name?:  string;     // for guardian copies: whose parent this is
};

type Payload = {
  subject:      string;
  body:         string;
  where_text?:  string;
  guardians_cc: boolean;
  recipients:   Recipient[];
  reply_to?:    string;
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

// Plain text in, simple HTML out: paragraphs on blank lines, <br> on single.
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
  const text = unsub
    ? `${who}\nTo stop receiving these emails: ${unsub}`
    : who;
  const html = unsub
    ? `${esc(who)}<br><a href="${unsub}" style="color:#777">Unsubscribe</a>`
    : esc(who);
  return { text, html };
}

async function sendOne(r: Recipient, subject: string, body: string, replyTo?: string) {
  const foot = footerFor(r);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from:     FROM_ADDRESS,
      to:       [r.email],
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return json({ error: "POST only" }, 405);

  if (!RESEND_KEY) return json({ error: "RESEND_API_KEY is not set on the server" }, 500);

  // ── who is calling ───────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Not signed in" }, 401);

  const asUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
  const { data: { user }, error: uErr } = await asUser.auth.getUser();
  if (uErr || !user) return json({ error: "Not signed in" }, 401);

  // ── the request ──────────────────────────────────────────────────────────
  let p: Payload;
  try { p = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }

  const subject = (p.subject || "").trim();
  const body    = (p.body    || "").trim();
  const recips  = Array.isArray(p.recipients) ? p.recipients.filter(r => r && r.email) : [];
  if (!subject)       return json({ error: "Subject is empty" }, 400);
  if (!body)          return json({ error: "Message is empty" }, 400);
  if (!recips.length) return json({ error: "No recipients" }, 400);
  if (recips.length > 2000) return json({ error: "Too many recipients in one blast (max 2000)" }, 400);

  // ── the record, before anything is sent ─────────────────────────────────
  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: prof } = await db.from("assignor_profiles").select("username").eq("id", user.id).maybeSingle();
  const senderName = prof?.username || user.email || user.id;

  const { data: log, error: lErr } = await db.from("blast_log").insert({
    sent_by:         user.id,
    sent_by_name:    senderName,
    subject, body,
    where_text:      p.where_text || null,
    recipient_count: recips.length,
    guardians_cc:    !!p.guardians_cc,
  }).select("id").single();
  if (lErr || !log) return json({ error: "Could not write blast_log: " + (lErr?.message || "?") }, 500);

  const { data: rows, error: rErr } = await db.from("blast_recipients").insert(
    recips.map(r => ({
      blast_id:    log.id,
      referee_id:  r.referee_id ?? null,
      email:       r.email,
      is_guardian: !!r.is_guardian,
    }))
  ).select("id,email");
  if (rErr || !rows) return json({ error: "Could not write blast_recipients: " + (rErr?.message || "?") }, 500);

  const rowIdByEmail = new Map(rows.map(x => [x.email.toLowerCase(), x.id]));

  // ── send, one at a time, recording each outcome as it lands ─────────────
  let sent = 0, failed = 0;
  const failures: { email: string; error: string }[] = [];

  for (const r of recips) {
    const rowId = rowIdByEmail.get(r.email.toLowerCase());
    try {
      const providerId = await sendOne(r, subject, body, p.reply_to || user.email || undefined);
      await db.from("blast_recipients").update({ status: "sent", provider_id: providerId ?? null }).eq("id", rowId);
      sent++;
    } catch (e) {
      const msg = (e as Error).message || String(e);
      await db.from("blast_recipients").update({ status: "failed", error: msg }).eq("id", rowId);
      failed++;
      failures.push({ email: r.email, error: msg });
    }
    await sleep(GAP_MS);
  }

  return json({ ok: true, blast_id: log.id, sent, failed, failures });
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
