// ═══════════════════════════════════════════════════════════════════════════
// notify-assignor — tell the RIGHT assignor something happened on their club
// 2026-09-17
//
// WHY
//   A club submitting a change request got "the assignor will be in touch"
//   and nobody was told. The assignor found out when they happened to open
//   the workstation and see the badge. Game uploads DID notify — through an
//   EmailJS template with one address baked in — so a Canterbury upload went
//   to Tod, not Dave.
//
//   Tod, 2026-09-17: "Make sure that this works for each assignor and they
//   have their own separate schedule change request page."
//
//   The club knows its assignor: assignors.clubs lists the clubs each one
//   covers. This function does that lookup server-side and sends via Resend
//   to THEIR address — reply_to_email, then email. Nothing is baked in.
//
// WHO MAY CALL
//   The club portal, with the anon key. Club admins are not logged in, so
//   there is no JWT to verify. The function is therefore strict about WHAT
//   it will send: only a fixed set of event types, only about a game id that
//   exists, only to an address it looked up itself. The caller supplies a
//   game id and an event name — never a recipient, never a body.
//
// EVENTS
//   { event: "change_request",       game_id }
//   { event: "cancellation_request", game_id }
//   { event: "games_uploaded",       club, count, game_list }   (no game_id)
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_KEY   = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const FROM         = "Referee Tool <notify@referee-tool.com>";
const SITE         = "https://referee-tool.com";

// ── SMS via Twilio ─────────────────────────────────────────────────────────
// Three secrets: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (the
// registered 10DLC number, E.164). Until all three exist, sendSms() returns
// "not configured" and nothing pretends to have texted anyone.
//
// ⚠️ CONSENT IS THE GATE, NOT THE CREDENTIALS. A text goes to a referee only
// if referees.sms_consent_at is set; to a guardian only if
// guardian_sms_consent_at is set. Both are stamped by the availability form
// when the person ticks the box. referees.sms_opt_in defaulted TRUE for
// everyone in July and is NOT consent — it is never read here.
const TW_SID  = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const TW_TOK  = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";
const TW_FROM = Deno.env.get("TWILIO_FROM") ?? "";
const smsReady = () => !!(TW_SID && TW_TOK && TW_FROM);

const e164 = (p: unknown) => {
  const d = String(p ?? "").replace(/\D/g, "");
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d.startsWith("1")) return "+" + d;
  return "";
};

async function sendSms(to: string, body: string): Promise<{ ok: boolean; sid?: string; error?: string }> {
  if (!smsReady()) return { ok: false, error: "SMS not configured (Twilio secrets missing)" };
  const num = e164(to);
  if (!num) return { ok: false, error: `bad phone "${to}"` };
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TW_SID}/Messages.json`, {
    method: "POST",
    headers: { "Authorization": "Basic " + btoa(`${TW_SID}:${TW_TOK}`), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: TW_FROM, To: num, Body: body }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, error: j?.message || `Twilio ${r.status}` };
  return { ok: true, sid: j?.sid };
}

// Record every text attempt, sent or not — the same "did Ross get it" answer
// the email log gives.
async function logSms(db: ReturnType<typeof createClient>, row: Record<string, unknown>) {
  try { await db.from("sms_log").insert(row); } catch (_) { /* never let logging break a send */ }
}

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// The assignor(s) for a club, by the club's Source Club name. More than one
// is possible (Tod + Eric are paired on some). Every match is notified.
async function assignorsFor(db: ReturnType<typeof createClient>, club: string) {
  // assignors.clubs holds whatever name the club goes by on the workstation —
  // "Canterbury Athletic Association" for some, "East Haddam" / "Griswold" for
  // others whose clubs row has NO "Club Name" and only a slug. Match either
  // the Source Club string as given or the clubs row it resolves to.
  const want = new Set([club.trim().toLowerCase()]);
  const { data: rows } = await db.from("clubs").select('name,"Club Name"');
  for (const r of rows || []) {
    const a = String(r["Club Name"] || "").trim().toLowerCase(), b = String(r.name || "").trim().toLowerCase();
    if (a && want.has(a) && b) want.add(b);
    if (b && want.has(b) && a) want.add(a);
  }
  const { data } = await db.from("assignors").select("name,email,auth_user_id,clubs");
  const hits = (data || []).filter(a => Array.isArray(a.clubs) && a.clubs.some((c: string) => want.has(String(c).trim().toLowerCase())));
  if (!hits.length) return [];
  // reply_to_email lives on assignor_profiles, keyed by auth id
  const ids = hits.map(a => a.auth_user_id).filter(Boolean);
  const { data: profs } = await db.from("assignor_profiles").select("id,email,reply_to_email").in("id", ids);
  const byId = new Map((profs || []).map(p => [p.id, p]));
  return hits.map(a => {
    const p = byId.get(a.auth_user_id);
    return { name: a.name, email: (p?.reply_to_email || p?.email || a.email || "").trim() };
  }).filter(a => a.email);
}

async function send(to: string, subject: string, text: string, html: string) {
  return sendWithReply(to, subject, text, html, undefined);
}
// Assignment confirmations reply to the assignor, so "I can't make it" lands
// with the person who can do something about it.
async function sendWithReply(to: string, subject: string, text: string, html: string, replyTo?: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, text, html, reply_to: replyTo || undefined }),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.message || `Resend ${r.status}`);
}

const fmtDate = (d: string) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "";
const fmtTime = (t: string) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return json({ error: "POST only" }, 405);
  if (!RESEND_KEY) return json({ error: "RESEND_API_KEY not set" }, 500);

  let p: any;
  try { p = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  // ── change / cancellation request on one game ────────────────────────────
  if (p.event === "change_request" || p.event === "cancellation_request") {
    const gid = Number(p.game_id);
    if (!gid) return json({ error: "game_id required" }, 400);
    const { data: g } = await db.from("games").select('id,"Source Club","Home Team","Away Team",date,time,"Age Group","Notes","Club Admin Email"').eq("id", gid).maybeSingle();
    if (!g) return json({ error: `Game ${gid} not found` }, 404);

    const club = String(g["Source Club"] || "");
    const who  = await assignorsFor(db, club);
    if (!who.length) return json({ ok: false, sent: 0, reason: `no assignor covers "${club}"` });

    // The latest request block from Notes, so the email carries what the club asked.
    const notes = String(g["Notes"] || "");
    const tag   = p.event === "cancellation_request" ? "CANCELLATION REQUEST" : "CHANGE REQUEST";
    const idx   = notes.lastIndexOf(`[${tag}`);
    // From the last "[CHANGE REQUEST" up to the next bracketed block, if any.
    const rest  = idx >= 0 ? notes.slice(idx) : "";
    const stop  = rest.search(/\n\[(?:RESOLVED|ASSIGNOR NOTE|CANCELLATION REQUEST|CHANGE REQUEST)/i);
    const ask   = stop > 0 ? rest.slice(0, stop).trim() : rest.trim();

    const isCancel = p.event === "cancellation_request";
    const matchup  = `${g["Home Team"] || "TBD"} vs ${g["Away Team"] || "TBD"}`;
    const when     = `${fmtDate(g.date)} ${fmtTime(g.time)}`.trim();
    const subject  = `${isCancel ? "Cancellation" : "Change"} request — ${club}: ${matchup}, ${when}`;
    const link     = `${SITE}/assignor-workstation.html?game=${gid}`;
    const text = `${club} has asked to ${isCancel ? "cancel" : "change"} a game.\n\n${matchup}\n${when} · ${g["Age Group"] || ""}\n\n${ask || "(no details given)"}\n\nOpen it: ${link}\n\nAll requests: ${SITE}/schedule-changes.html`;
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:600px">
<p><b>${esc(club)}</b> has asked to <b>${isCancel ? "cancel" : "change"}</b> a game.</p>
<p style="font-size:17px;margin:14px 0 4px"><b>${esc(matchup)}</b><br><span style="color:#555">${esc(when)} · ${esc(g["Age Group"] || "")}</span></p>
<pre style="background:#f6f6f6;border-left:4px solid #e94560;padding:10px 12px;white-space:pre-wrap;font-family:inherit;font-size:14px">${esc(ask || "(no details given)")}</pre>
<p><a href="${link}" style="display:inline-block;background:#0f3460;color:#fff;padding:10px 18px;border-radius:7px;text-decoration:none;font-weight:700">Open in Workstation</a></p>
<p style="font-size:12px;color:#888">All requests: <a href="${SITE}/schedule-changes.html">${SITE}/schedule-changes.html</a></p>
</div>`;

    let sent = 0; const failures: string[] = [];
    for (const a of who) { try { await send(a.email, subject, text, html); sent++; } catch (e) { failures.push(`${a.email}: ${(e as Error).message}`); } }
    return json({ ok: sent > 0, sent, to: who.map(a => a.name), failures });
  }

  // ── assignment confirmed → tell the referee (and the parent) ─────────────
  // Tod, 2026-09-18: "Central Assign isn't sending emails to confirm that
  // they have been assigned — on either the parents or the kids... if I
  // click that CA button can you wire this so it kicks out a confirmation
  // email since CA isn't working?"
  //
  // Fires when the assignor marks a slot ✓ CA on the workstation. The
  // referee gets date, time, venue, field, position, and who to reply to.
  // A minor's guardian gets their own copy — same rule as blasts, not a
  // setting. A minor with no guardian on file: the referee is still told
  // (they have a game to get to) and the response says the parent wasn't.
  //
  //   { event: "assignment_confirmed", game_id, position }
  //   position ∈ "Center Referee" | "AR 1" | "AR 2"
  if (p.event === "assignment_confirmed") {
    const gid = Number(p.game_id);
    const pos = String(p.position || "");
    if (!gid || !["Center Referee", "AR 1", "AR 2"].includes(pos)) return json({ error: "game_id and a valid position required" }, 400);

    const { data: g } = await db.from("games")
      .select('id,"Source Club","Home Team","Away Team",date,time,"Age Group","Gender",game_type,"Venue ID","Field ID",field,"Center Referee","AR 1","AR 2"')
      .eq("id", gid).maybeSingle();
    if (!g) return json({ error: `Game ${gid} not found` }, 404);

    const refName = String(g[pos] || "").trim();
    if (!refName || /^(EMPTY|FILLED|TBD)$/i.test(refName)) return json({ ok: false, reason: `no referee in ${pos}` });

    // The referee record — by exact name, then loosely.
    const REF_COLS = 'id,name,email,phone,age,"Guardian Email","Guardian Name","Guardian Phone",sms_consent_at,guardian_sms_consent_at';
    let { data: ref } = await db.from("referees").select(REF_COLS).ilike("name", refName).maybeSingle();
    if (!ref) {
      const parts = refName.split(/\s+/);
      const { data: cands } = await db.from("referees").select(REF_COLS)
        .ilike("name", `%${parts[parts.length - 1]}%`).limit(10);
      ref = (cands || []).find(c => c.name.toLowerCase().replace(/[^a-z]/g, "") === refName.toLowerCase().replace(/[^a-z]/g, "")) || null;
    }
    if (!ref)        return json({ ok: false, reason: `referee "${refName}" not on roster` });
    if (!ref.email)  return json({ ok: false, reason: `${ref.name} has no email on file` });

    // Venue + field, by CA id
    const [{ data: ven }, { data: fld }] = await Promise.all([
      g["Venue ID"] ? db.from("venues").select('"Venue Name",address,city').eq('"Venue ID"', g["Venue ID"]).maybeSingle() : Promise.resolve({ data: null }),
      g["Field ID"] ? db.from("fields").select('"Field Name"').eq('"Field ID"', g["Field ID"]).maybeSingle()             : Promise.resolve({ data: null }),
    ]);
    const venueName = ven?.["Venue Name"] || "";
    const fieldName = fld?.["Field Name"] || g.field || "";
    const where     = [venueName, fieldName].filter(Boolean).join(" · ");
    const addr      = [ven?.address, ven?.city].filter(Boolean).join(", ");
    const maps      = addr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueName + ", " + addr)}` : "";

    // Who replies go to — the assignor for this club
    const who = await assignorsFor(db, String(g["Source Club"] || ""));
    const replyTo = who[0]?.email || undefined;
    const assignorName = who[0]?.name || "your assignor";

    const posLabel = pos === "Center Referee" ? "Center Referee" : pos === "AR 1" ? "Assistant Referee 1" : "Assistant Referee 2";
    const matchup  = `${g["Home Team"] || "TBD"} vs ${g["Away Team"] || "TBD"}`;
    const when     = `${fmtDate(g.date)} · ${fmtTime(g.time)}`;
    const div      = [g["Age Group"], g["Gender"]].filter(Boolean).join(" ");
    const club     = String(g["Source Club"] || "");
    const first    = ref.name.split(/\s+/)[0];

    const subject = `You're assigned: ${matchup} — ${fmtDate(g.date)} ${fmtTime(g.time)} (${posLabel})`;
    const bodyText = (toParent: boolean) =>
`${toParent ? `${ref.name} has been assigned` : `Hi ${first}, you're assigned`} to a game.

${matchup}
${when}
${div}${g.game_type ? ` · ${g.game_type}` : ""} · ${club}
Position: ${posLabel}
Where: ${where || "TBD"}${addr ? `\n${addr}` : ""}${maps ? `\nMap: ${maps}` : ""}

Please arrive 30 minutes before kickoff. If you can't make it, reply to this email right away so ${assignorName} can find cover.

— ${assignorName}`;
    const bodyHtml = (toParent: boolean) =>
`<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:600px">
<p>${toParent ? `<b>${esc(ref.name)}</b> has been assigned to a game.` : `Hi ${esc(first)}, you're assigned to a game.`}</p>
<div style="background:#f6f6f6;border-left:4px solid #00c853;padding:12px 16px;margin:14px 0">
<div style="font-size:18px;font-weight:700">${esc(matchup)}</div>
<div style="font-size:16px;margin-top:4px">${esc(when)}</div>
<div style="color:#555;margin-top:2px">${esc(div)}${g.game_type ? ` · ${esc(g.game_type)}` : ""} · ${esc(club)}</div>
<div style="margin-top:10px"><b>Position:</b> ${esc(posLabel)}</div>
<div><b>Where:</b> ${esc(where || "TBD")}${addr ? `<br><span style="color:#555">${esc(addr)}</span>` : ""}</div>
${maps ? `<div style="margin-top:8px"><a href="${maps}" style="color:#0f3460">Open in Google Maps</a></div>` : ""}
</div>
<p>Please arrive <b>30 minutes before kickoff</b>. If you can't make it, reply to this email right away so ${esc(assignorName)} can find cover.</p>
<p style="color:#555">— ${esc(assignorName)}</p>
</div>`;

    // Logged like everything else, so "did Sylas get his confirmation" has an
    // answer in blast_log/blast_recipients: where_text = "assignment → <name> · <pos> · game N".
    const { data: alog } = await db.from("blast_log").insert({
      sent_by: null, sent_by_name: assignorName, subject, body: bodyText(false),
      where_text: `assignment → ${ref.name} · ${posLabel} · game ${gid}`, recipient_count: 1, guardians_cc: true,
    }).select("id").single();
    const logRow = async (email: string, isG: boolean, ok: boolean, err?: string) => {
      if (alog) await db.from("blast_recipients").insert({ blast_id: alog.id, referee_id: ref.id, email, is_guardian: isG, status: ok ? "sent" : "failed", error: ok ? null : (err || "?") });
    };

    const results: Record<string, string> = {};
    try { await sendWithReply(ref.email, subject, bodyText(false), bodyHtml(false), replyTo); results.referee = "sent"; await logRow(ref.email, false, true); }
    catch (e) { results.referee = "failed: " + (e as Error).message; await logRow(ref.email, false, false, (e as Error).message); }

    const isMinor = ref.age != null && Number(ref.age) < 18;
    const gEmail  = String(ref["Guardian Email"] || "").trim();
    if (isMinor) {
      if (gEmail) {
        try { await sendWithReply(gEmail, subject, bodyText(true), bodyHtml(true), replyTo); results.guardian = "sent"; await logRow(gEmail, true, true); }
        catch (e) { results.guardian = "failed: " + (e as Error).message; await logRow(gEmail, true, false, (e as Error).message); }
      } else {
        results.guardian = "no guardian on file";
      }
    }
    // ── texts, on top of the emails — only where consent exists ─────────────
    // Short. A phone screen, not a letter. The email carries the detail.
    const smsBody = `Referee Tool: you're assigned ${posLabel === "Center Referee" ? "CENTER" : posLabel.replace("Assistant Referee ", "AR")} — ${matchup}, ${fmtDate(g.date)} ${fmtTime(g.time)}, ${venueName || "venue TBD"}${fieldName ? " " + fieldName : ""}. Arrive 30 min early. Can't make it? Reply to the email from ${assignorName}.`;
    const smsBase = { kind: "assignment", game_id: gid, referee_id: ref.id, body: smsBody };
    if (ref.sms_consent_at && ref.phone) {
      const r = await sendSms(ref.phone, smsBody);
      results.referee_sms = r.ok ? "sent" : r.error || "failed";
      await logSms(db, { ...smsBase, to_phone: e164(ref.phone) || String(ref.phone), is_guardian: false, status: r.ok ? "sent" : (r.error?.includes("not configured") ? "skipped" : "failed"), provider_id: r.sid ?? null, error: r.ok ? null : r.error });
    } else {
      results.referee_sms = ref.sms_consent_at ? "no phone" : "no consent";
    }
    if (isMinor) {
      const gPhone = String(ref["Guardian Phone"] || "").trim();
      if (ref.guardian_sms_consent_at && gPhone) {
        const r = await sendSms(gPhone, smsBody.replace("you're assigned", `${ref.name} is assigned`));
        results.guardian_sms = r.ok ? "sent" : r.error || "failed";
        await logSms(db, { ...smsBase, to_phone: e164(gPhone) || gPhone, is_guardian: true, status: r.ok ? "sent" : (r.error?.includes("not configured") ? "skipped" : "failed"), provider_id: r.sid ?? null, error: r.ok ? null : r.error });
      } else {
        results.guardian_sms = ref.guardian_sms_consent_at ? "no phone" : "no consent";
      }
    }

    return json({ ok: results.referee === "sent", referee: ref.name, email: ref.email, minor: isMinor, guardian_email: gEmail || null, sms_ready: smsReady(), results });
  }

  // ── a direct message from an assignor to one referee ─────────────────────
  // Tod, 2026-09-18: "where is the email functionality on the assignor
  // workstation to send an email to a ref?" There wasn't one — the ref
  // pane showed a mailto: link that opened Gmail and left the system.
  //
  // This one REQUIRES a logged-in assignor (JWT), because a person is
  // writing free text to a named referee. The club portal's anon calls
  // can't reach it. Reply-to is the sender's assignor address. A minor's
  // guardian gets a copy — same rule as everything else. Logged to
  // blast_log/blast_recipients so it's answerable later.
  //
  //   { event: "message_referee", referee_id | referee_ids[], subject, body, game_id?, date? }
  if (p.event === "message_referee") {
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const asUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json({ error: "Not signed in" }, 401);

    // One referee or several. Tod, 2026-09-18: "in Central Assign ... you
    // could check one, two, or three of the refs, and say, please make sure
    // you submit your availability, or please submit your game reports, or
    // wish them a good game." Each checked referee gets their own copy under
    // their own name; a minor's parent is copied; every send is logged.
    const ids = [...new Set(
      (Array.isArray(p.referee_ids) ? p.referee_ids : [p.referee_id]).map((x: unknown) => Number(x)).filter((n: number) => n > 0)
    )] as number[];
    const subject = String(p.subject || "").trim();
    const body    = String(p.body || "").trim();
    if (!ids.length) return json({ error: "referee_id(s) required" }, 400);
    if (ids.length > 200) return json({ error: "Too many at once (max 200) — use Referee Blasts" }, 400);
    if (!subject || !body) return json({ error: "Subject and message are required" }, 400);

    const { data: refs } = await db.from("referees").select('id,name,email,age,"Guardian Email","Guardian Name",unsubscribe_token').in("id", ids);
    const byId = new Map((refs || []).map(r => [Number(r.id), r]));
    const targets = ids.map(id => byId.get(id)).filter(Boolean) as any[];
    if (!targets.length) return json({ error: "Referee not found" }, 404);

    const { data: prof } = await db.from("assignor_profiles").select("username,name,email,reply_to_email").eq("id", user.id).maybeSingle();
    const replyTo  = (prof?.reply_to_email || prof?.email || user.email || "").trim() || undefined;
    const fromName = prof?.name || prof?.username || "your assignor";

    const where = targets.length === 1
      ? `direct → ${targets[0].name}`
      : `direct → ${targets.length} referees${p.game_id ? ` · game ${Number(p.game_id)}` : p.date ? ` · ${String(p.date)}` : ""}`;
    const { data: log } = await db.from("blast_log").insert({
      sent_by: user.id, sent_by_name: prof?.username || user.email, subject, body,
      where_text: where, recipient_count: targets.length, guardians_cc: true,
    }).select("id").single();

    const sent: string[] = [], failed: { name: string; error: string }[] = [], noEmail: string[] = [];
    let guardians = 0;
    const results: Record<string, string> = {};   // kept for the single-referee response shape

    for (const ref of targets) {
      if (!ref.email) { noEmail.push(ref.name); results.referee = `${ref.name} has no email on file`; continue; }
      const first = String(ref.name).split(/\s+/)[0];
      const text  = (toParent: boolean) => `${toParent ? `A message from ${fromName} to ${ref.name}:` : `Hi ${first},`}\n\n${body}\n\n— ${fromName}${replyTo ? `\n${replyTo}` : ""}`;
      const html  = (toParent: boolean) => `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:600px">
<p>${toParent ? `A message from <b>${esc(fromName)}</b> to <b>${esc(ref.name)}</b>:` : `Hi ${esc(first)},`}</p>
<div style="white-space:pre-wrap">${esc(body)}</div>
<p style="color:#555;margin-top:18px">— ${esc(fromName)}${replyTo ? `<br><a href="mailto:${esc(replyTo)}" style="color:#0f3460">${esc(replyTo)}</a>` : ""}</p>
</div>`;

      let ok = false, err = "";
      try { await sendWithReply(ref.email, subject, text(false), html(false), replyTo); ok = true; }
      catch (e) { err = (e as Error).message; }
      if (ok) sent.push(ref.name); else failed.push({ name: ref.name, error: err });
      results.referee = ok ? "sent" : "failed: " + err;
      if (log) await db.from("blast_recipients").insert({ blast_id: log.id, referee_id: ref.id, email: ref.email, is_guardian: false, status: ok ? "sent" : "failed", error: ok ? null : err });

      const isMinor = ref.age != null && Number(ref.age) < 18;
      const gEmail  = String(ref["Guardian Email"] || "").trim();
      if (isMinor && gEmail) {
        let gok = false, gerr = "";
        try { await sendWithReply(gEmail, subject, text(true), html(true), replyTo); gok = true; guardians++; }
        catch (e) { gerr = (e as Error).message; }
        results.guardian = gok ? "sent" : "failed: " + gerr;
        if (log) await db.from("blast_recipients").insert({ blast_id: log.id, referee_id: ref.id, email: gEmail, is_guardian: true, status: gok ? "sent" : "failed", error: gok ? null : gerr });
      } else if (isMinor) {
        results.guardian = "no guardian on file";
      }
      if (targets.length > 1) await new Promise(r => setTimeout(r, 550));   // Resend: 2 req/s
    }

    const one = targets.length === 1 ? targets[0] : null;
    return json({
      ok: sent.length > 0,
      sent, failed, no_email: noEmail, guardians, reply_to: replyTo, blast_id: log?.id ?? null,
      // single-referee shape, as before
      referee: one?.name, email: one?.email, minor: one ? (one.age != null && Number(one.age) < 18) : undefined, results,
    });
  }

  // ── games uploaded (replaces the one-inbox EmailJS template) ─────────────
  if (p.event === "games_uploaded") {
    const club  = String(p.club || "").trim();
    const count = Number(p.count) || 0;
    if (!club || !count) return json({ error: "club and count required" }, 400);
    const who = await assignorsFor(db, club);
    if (!who.length) return json({ ok: false, sent: 0, reason: `no assignor covers "${club}"` });
    const list = String(p.game_list || "").slice(0, 4000);
    const subject = `${club} uploaded ${count} game${count === 1 ? "" : "s"}`;
    const text = `${club} just submitted ${count} game${count === 1 ? "" : "s"}.\n\n${list}\n\nWorkstation: ${SITE}/assignor-workstation.html`;
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:600px"><p><b>${esc(club)}</b> just submitted <b>${count}</b> game${count === 1 ? "" : "s"}.</p><pre style="background:#f6f6f6;padding:10px 12px;white-space:pre-wrap;font-family:inherit;font-size:13px">${esc(list)}</pre><p><a href="${SITE}/assignor-workstation.html" style="display:inline-block;background:#0f3460;color:#fff;padding:10px 18px;border-radius:7px;text-decoration:none;font-weight:700">Open Workstation</a></p></div>`;
    let sent = 0; const failures: string[] = [];
    for (const a of who) { try { await send(a.email, subject, text, html); sent++; } catch (e) { failures.push(`${a.email}: ${(e as Error).message}`); } }
    return json({ ok: sent > 0, sent, to: who.map(a => a.name), failures });
  }

  return json({ error: "Unknown event" }, 400);
});
