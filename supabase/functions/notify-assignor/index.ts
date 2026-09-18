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
    let { data: ref } = await db.from("referees").select('id,name,email,age,"Guardian Email","Guardian Name"').ilike("name", refName).maybeSingle();
    if (!ref) {
      const parts = refName.split(/\s+/);
      const { data: cands } = await db.from("referees").select('id,name,email,age,"Guardian Email","Guardian Name"')
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

    const results: Record<string, string> = {};
    try { await sendWithReply(ref.email, subject, bodyText(false), bodyHtml(false), replyTo); results.referee = "sent"; }
    catch (e) { results.referee = "failed: " + (e as Error).message; }

    const isMinor = ref.age != null && Number(ref.age) < 18;
    const gEmail  = String(ref["Guardian Email"] || "").trim();
    if (isMinor) {
      if (gEmail) {
        try { await sendWithReply(gEmail, subject, bodyText(true), bodyHtml(true), replyTo); results.guardian = "sent"; }
        catch (e) { results.guardian = "failed: " + (e as Error).message; }
      } else {
        results.guardian = "no guardian on file";
      }
    }
    return json({ ok: results.referee === "sent", referee: ref.name, email: ref.email, minor: isMinor, guardian_email: gEmail || null, results });
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
