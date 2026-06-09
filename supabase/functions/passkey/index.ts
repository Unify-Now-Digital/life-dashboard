// Passkey (WebAuthn) auth for Life Dashboard — single-owner.
//
// Actions (POST { action, ... }):
//   register-options  [auth required] → options to create a passkey
//   register-verify   [auth required] → verify + store the new credential
//   auth-options      [public]        → options to sign in with a passkey
//   auth-verify       [public]        → verify the assertion, mint a session
//
// "auth required" means a valid Supabase access token for the owner email in
// the Authorization header (the one-time email bootstrap). Signing in is
// public by necessity; security comes from verifying the assertion signature
// against the stored public key — only the owner can enrol, so only the owner
// can authenticate. On success we mint a real session via the admin API
// (generateLink → hashed_token), which the client exchanges with verifyOtp.
//
// RP ID + expected origin are derived from the request Origin header, so this
// works on whatever domain serves the app with no hardcoding.

import { createClient } from "npm:@supabase/supabase-js@2";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "npm:@simplewebauthn/server@13";

const OWNER_EMAIL = "arinmelvin@gmail.com";
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function bytesFromB64url(s: string): Uint8Array {
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = norm.length % 4 ? "=".repeat(4 - (norm.length % 4)) : "";
  const bin = atob(norm + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin") || "";
  const headers = { ...corsHeaders(origin), "content-type": "application/json" };
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  let rpID = "";
  try {
    const host = new URL(origin).hostname;
    // Scope passkeys to the registrable parent domain so ONE credential works
    // across every subdomain (arin-melvin, spanish-arin-melvin, the apex).
    // Other hosts (localhost, *.pages.dev previews) keep their exact hostname.
    rpID =
      host === "lifedashboard.live" || host.endsWith(".lifedashboard.live")
        ? "lifedashboard.live"
        : host;
  } catch {
    return json({ error: "missing/invalid Origin" }, 400);
  }
  const expectedOrigin = origin;

  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  // Resolve the single owner user (must already exist via email bootstrap).
  async function ownerUser() {
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) throw error;
    return data.users.find((u) => (u.email || "").toLowerCase() === OWNER_EMAIL) || null;
  }
  // Require an authenticated owner (bearer access token).
  async function requireOwner() {
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return null;
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return null;
    if ((data.user.email || "").toLowerCase() !== OWNER_EMAIL) return null;
    return data.user;
  }

  try {
    if (action === "register-options") {
      const user = await requireOwner();
      if (!user) return json({ error: "unauthorized" }, 401);
      const { data: existing } = await admin
        .from("user_passkeys")
        .select("credential_id, transports")
        .eq("user_id", user.id);
      const options = await generateRegistrationOptions({
        rpName: "Life Dashboard",
        rpID,
        userID: new TextEncoder().encode(user.id),
        userName: OWNER_EMAIL,
        attestationType: "none",
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "required",
          authenticatorAttachment: "platform",
        },
        excludeCredentials: (existing || []).map((c: any) => ({
          id: c.credential_id,
          transports: c.transports || undefined,
        })),
      });
      await admin.from("webauthn_challenges").insert({
        user_id: user.id,
        challenge: options.challenge,
        purpose: "register",
        expires_at: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
      });
      return json(options);
    }

    if (action === "register-verify") {
      const user = await requireOwner();
      if (!user) return json({ error: "unauthorized" }, 401);
      const { response, label } = body;
      const { data: ch } = await admin
        .from("webauthn_challenges")
        .select("*")
        .eq("user_id", user.id)
        .eq("purpose", "register")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!ch) return json({ error: "no challenge" }, 400);

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: ch.challenge,
        expectedOrigin,
        expectedRPID: rpID,
        requireUserVerification: true,
      });
      await admin.from("webauthn_challenges").delete().eq("id", ch.id);
      if (!verification.verified || !verification.registrationInfo) {
        return json({ verified: false }, 400);
      }
      const cred = verification.registrationInfo.credential;
      await admin.from("user_passkeys").insert({
        user_id: user.id,
        credential_id: cred.id,
        public_key: b64urlFromBytes(cred.publicKey),
        counter: cred.counter ?? 0,
        transports: response?.response?.transports || null,
        label: label || "Passkey",
      });
      return json({ verified: true });
    }

    if (action === "auth-options") {
      const owner = await ownerUser();
      const options = await generateAuthenticationOptions({
        rpID,
        userVerification: "required",
        allowCredentials: [], // discoverable credentials — platform offers the passkey
      });
      await admin.from("webauthn_challenges").insert({
        user_id: owner?.id ?? null,
        challenge: options.challenge,
        purpose: "authenticate",
        expires_at: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
      });
      return json(options);
    }

    if (action === "auth-verify") {
      const { response } = body;
      const credId = response?.id;
      if (!credId) return json({ error: "bad response" }, 400);
      const { data: pk } = await admin
        .from("user_passkeys")
        .select("*")
        .eq("credential_id", credId)
        .maybeSingle();
      if (!pk || !pk.public_key) return json({ error: "unknown credential" }, 400);

      const { data: ch } = await admin
        .from("webauthn_challenges")
        .select("*")
        .eq("purpose", "authenticate")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!ch) return json({ error: "no challenge" }, 400);

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: ch.challenge,
        expectedOrigin,
        expectedRPID: rpID,
        credential: {
          id: pk.credential_id,
          publicKey: bytesFromB64url(pk.public_key),
          counter: Number(pk.counter || 0),
          transports: pk.transports || undefined,
        },
        requireUserVerification: true,
      });
      await admin.from("webauthn_challenges").delete().eq("id", ch.id);
      if (!verification.verified) return json({ verified: false }, 400);

      await admin
        .from("user_passkeys")
        .update({
          counter: verification.authenticationInfo.newCounter,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", pk.id);

      // Mint a real Supabase session without sending an email.
      const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email: OWNER_EMAIL,
      });
      if (linkErr || !link?.properties?.hashed_token) {
        return json({ error: "session mint failed" }, 500);
      }
      return json({ verified: true, token_hash: link.properties.hashed_token });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
