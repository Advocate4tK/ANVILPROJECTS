// ═══════════════════════════════════════════════════════════════════════════
// admin-user — create / password / suspend for assignor accounts
// 2026-09-16
//
// WHY THIS EXISTS
//   users.html did these with the service_role key IN config.js — a public
//   repo. That key bypasses every RLS policy in the database; anyone who
//   viewed source had it. It has since stopped working ("Unregistered API
//   key"), which is the right outcome for a leaked key and the wrong one for
//   Tod trying to add Dave Paquette.
//
//   The service key belongs here, as a secret, behind a check that the caller
//   is an admin. The page calls this; config.js loses the key entirely.
//
// ACTIONS  (POST, JSON, Authorization: Bearer <caller's JWT>)
//   { action: "create",   name, username, email, password, role?, clubs? }
//   { action: "password", user_id, password }
//   { action: "suspend",  user_id, suspended: true|false }
//
// WHO MAY CALL
//   A logged-in user whose assignor_profiles.tier is 'admin'. Nobody else.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY     = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST")    return json({ error: "POST only" }, 405);

  // ── caller must be a logged-in admin ─────────────────────────────────────
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Not signed in" }, 401);
  const asUser = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
  const { data: { user }, error: uErr } = await asUser.auth.getUser();
  if (uErr || !user) return json({ error: "Not signed in" }, 401);

  const db = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: me } = await db.from("assignor_profiles").select("tier,username").eq("id", user.id).maybeSingle();
  if ((me?.tier || "").toLowerCase() !== "admin") return json({ error: "Admins only" }, 403);

  let p: any;
  try { p = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }

  // ── create ───────────────────────────────────────────────────────────────
  if (p.action === "create") {
    const name     = String(p.name     || "").trim();
    const username = String(p.username || "").trim().toLowerCase();
    const email    = String(p.email    || "").trim().toLowerCase();
    const password = String(p.password || "");
    const role     = String(p.role     || "Assignor");
    const clubs: string[] = Array.isArray(p.clubs) ? p.clubs.map(String) : [];
    if (!name || !username || !email) return json({ error: "name, username and email are required" }, 400);
    if (password.length < 8)          return json({ error: "Password must be at least 8 characters" }, 400);
    if (!/^[a-z0-9._-]+$/.test(username)) return json({ error: "Username: letters, digits, . _ - only" }, 400);

    const { data: taken } = await db.from("assignor_profiles").select("id").eq("username", username).maybeSingle();
    if (taken) return json({ error: `Username "${username}" is already in use` }, 409);

    const { data: created, error: cErr } = await db.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { name, username },
    });
    if (cErr || !created?.user) return json({ error: "Auth: " + (cErr?.message || "could not create user") }, 500);
    const uid = created.user.id;

    // Two rows keyed by the auth id — the same shape every existing assignor has.
    const { error: pErr } = await db.from("assignor_profiles").insert({
      id: uid, name, username, email, clubs, default_view: "standard", suspended: false,
    });
    if (pErr) { await db.auth.admin.deleteUser(uid); return json({ error: "profile: " + pErr.message }, 500); }

    const { error: aErr } = await db.from("assignors").insert({
      name, role, email, clubs, auth_user_id: uid, phone: "",
      permissions: ["cardWorkstation", "cardBanners"],
    });
    if (aErr) {
      await db.from("assignor_profiles").delete().eq("id", uid);
      await db.auth.admin.deleteUser(uid);
      return json({ error: "assignors: " + aErr.message }, 500);
    }
    return json({ ok: true, user_id: uid, username, email, clubs, by: me?.username });
  }

  // ── password ─────────────────────────────────────────────────────────────
  if (p.action === "password") {
    const password = String(p.password || "");
    if (!p.user_id)           return json({ error: "user_id required" }, 400);
    if (password.length < 8)  return json({ error: "Password must be at least 8 characters" }, 400);
    const { error } = await db.auth.admin.updateUserById(String(p.user_id), { password });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  // ── suspend / unsuspend ──────────────────────────────────────────────────
  if (p.action === "suspend") {
    if (!p.user_id) return json({ error: "user_id required" }, 400);
    const suspended = !!p.suspended;
    const { error } = await db.from("assignor_profiles").update({ suspended }).eq("id", String(p.user_id));
    if (error) return json({ error: error.message }, 500);
    // Banning at the auth layer too, so a suspended login fails at the door.
    await db.auth.admin.updateUserById(String(p.user_id), { ban_duration: suspended ? "876000h" : "none" });
    return json({ ok: true, suspended });
  }

  return json({ error: "Unknown action" }, 400);
});
