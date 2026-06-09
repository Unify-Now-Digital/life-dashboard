// Passkey (WebAuthn) cloud sign-in — the real Supabase auth, server-verified by
// the `passkey` Edge Function.
//
// This is NOT the local privacy lock (that's authLocal.js, which only checks a
// gesture happened). Here the assertion signature is verified server-side
// against a stored public key, then a genuine Supabase session is minted.
//
// Flow:
//   sign in  → auth-options → navigator.credentials.get → auth-verify
//              → { token_hash } → supabase.auth.verifyOtp → session
//   enrol    → register-options → navigator.credentials.create → register-verify
//
// Kept dependency-free on purpose (same raw-WebAuthn approach as authLocal.js);
// only the Edge Function uses a verification library, server-side.

import { supabase } from "./supabase";

const URL_BASE = import.meta.env?.VITE_SUPABASE_URL;
const ANON = import.meta.env?.VITE_SUPABASE_ANON_KEY;
const FN = `${URL_BASE}/functions/v1/passkey`;

function bufToB64url(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBuf(b64) {
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const norm = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(norm);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out.buffer;
}

async function call(action, payload, accessToken) {
  const res = await fetch(FN, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: ANON,
      Authorization: `Bearer ${accessToken || ANON}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

export function isPasskeySupported() {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    !!navigator.credentials &&
    typeof navigator.credentials.get === "function"
  );
}

export async function isPlatformAuthenticatorAvailable() {
  if (!isPasskeySupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Server options (base64url JSON) → live CredentialCreationOptions.
function toCreateOptions(o) {
  return {
    publicKey: {
      ...o,
      challenge: b64urlToBuf(o.challenge),
      user: { ...o.user, id: b64urlToBuf(o.user.id) },
      excludeCredentials: (o.excludeCredentials || []).map((c) => ({
        ...c,
        id: b64urlToBuf(c.id),
      })),
    },
  };
}

function toGetOptions(o) {
  return {
    publicKey: {
      ...o,
      challenge: b64urlToBuf(o.challenge),
      allowCredentials: (o.allowCredentials || []).map((c) => ({
        ...c,
        id: b64urlToBuf(c.id),
      })),
    },
  };
}

// Live credential → base64url JSON the @simplewebauthn server expects.
function registrationJSON(cred) {
  const r = cred.response;
  return {
    id: cred.id,
    rawId: bufToB64url(cred.rawId),
    type: cred.type,
    clientExtensionResults: cred.getClientExtensionResults?.() || {},
    authenticatorAttachment: cred.authenticatorAttachment || undefined,
    response: {
      clientDataJSON: bufToB64url(r.clientDataJSON),
      attestationObject: bufToB64url(r.attestationObject),
      transports: r.getTransports ? r.getTransports() : undefined,
    },
  };
}

function assertionJSON(cred) {
  const r = cred.response;
  return {
    id: cred.id,
    rawId: bufToB64url(cred.rawId),
    type: cred.type,
    clientExtensionResults: cred.getClientExtensionResults?.() || {},
    authenticatorAttachment: cred.authenticatorAttachment || undefined,
    response: {
      clientDataJSON: bufToB64url(r.clientDataJSON),
      authenticatorData: bufToB64url(r.authenticatorData),
      signature: bufToB64url(r.signature),
      userHandle: r.userHandle ? bufToB64url(r.userHandle) : undefined,
    },
  };
}

// Sign in with an existing passkey. Resolves to true once a session is set.
export async function signInWithPasskey() {
  const options = await call("auth-options", {});
  const cred = await navigator.credentials.get(toGetOptions(options));
  if (!cred) throw new Error("Cancelled.");
  const { token_hash } = await call("auth-verify", { response: assertionJSON(cred) });
  if (!token_hash) throw new Error("Verification failed.");
  const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash });
  if (error) throw error;
  return true;
}

// Enrol a passkey for the currently signed-in (email-bootstrapped) session.
export async function enrollPasskey(label) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in by email first, then add this device.");
  const token = session.access_token;
  const options = await call("register-options", {}, token);
  const cred = await navigator.credentials.create(toCreateOptions(options));
  if (!cred) throw new Error("Cancelled.");
  const out = await call(
    "register-verify",
    { response: registrationJSON(cred), label: label || deviceLabel() },
    token,
  );
  if (!out.verified) throw new Error("Could not register passkey.");
  return true;
}

function deviceLabel() {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/.test(ua)) return "iPhone / iPad";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  return "This device";
}
