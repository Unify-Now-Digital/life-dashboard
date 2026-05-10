// Account-tied device lock — PIN + optional WebAuthn (Face ID / Touch ID).
//
// Sits IN FRONT of AuthGate. The dashboard contains personal data; this layer
// keeps it private when the device is shared or stolen.
//
// Source of truth: Supabase tables `user_security` (PIN hash + salt + lock
// disabled flag) and `user_passkeys` (one row per registered device). The
// localStorage entries below are a write-through cache so the PIN gate can
// run before any network round-trip on cold start. `syncFromCloud()` pulls
// fresh values from Supabase after sign-in; mutations dual-write.
//
// If Supabase isn't configured the cloud layer is skipped entirely and the
// lock behaves exactly as it did before — local-only.
//
// Cache:
//   ls.pin         hex SHA-256 of the user's PIN (4-8 digits)
//   ls.salt        hex used as PIN salt
//   ls.cred        legacy single-credential id; superseded by ls.passkeys
//   ls.passkeys    JSON array [{ id, credential_id, label }]
//   ls.disabled    "1" if user explicitly skipped the lock
//   ss.unlocked    "1" once unlocked for the current tab session
//
// Treat this as a privacy lock, not a cryptographic vault. PIN brute-force
// is fast against SHA-256 — RLS keeps cross-user reads out, but anyone with
// account access could enumerate a 4–8-digit PIN. Stronger KDF is a future
// upgrade (schema-compatible).

import { supabase, isSupabaseEnabled } from "./supabase";

const LS_PIN = "lifeDashboard:auth:pin";
const LS_SALT = "lifeDashboard:auth:salt";
const LS_CRED = "lifeDashboard:auth:cred";
const LS_PASSKEYS = "lifeDashboard:auth:passkeys";
const LS_DISABLED = "lifeDashboard:auth:disabled";
const SS_UNLOCKED = "lifeDashboard:auth:unlocked";

function toHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bufToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBuf(b64) {
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const norm = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(norm);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out.buffer;
}

async function sha256Hex(input) {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return toHex(buf);
}

function getOrCreateSalt() {
  let salt = localStorage.getItem(LS_SALT);
  if (!salt) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    salt = toHex(arr);
    localStorage.setItem(LS_SALT, salt);
  }
  return salt;
}

export function isLockEnabled() {
  if (localStorage.getItem(LS_DISABLED) === "1") return false;
  return !!localStorage.getItem(LS_PIN);
}

export function isLockSkipped() {
  return localStorage.getItem(LS_DISABLED) === "1";
}

export function isUnlocked() {
  return sessionStorage.getItem(SS_UNLOCKED) === "1";
}

export function markUnlocked() {
  sessionStorage.setItem(SS_UNLOCKED, "1");
}

export function lockNow() {
  sessionStorage.removeItem(SS_UNLOCKED);
}

export async function setPin(pin) {
  const salt = getOrCreateSalt();
  const hash = await sha256Hex(`${salt}:${pin}`);
  localStorage.setItem(LS_PIN, hash);
  localStorage.removeItem(LS_DISABLED);
  await writeSecurityToCloud({ pin_hash: hash, pin_salt: salt, lock_disabled: false });
}

export async function verifyPin(pin) {
  const stored = localStorage.getItem(LS_PIN);
  if (!stored) return false;
  const salt = getOrCreateSalt();
  const hash = await sha256Hex(`${salt}:${pin}`);
  return hash === stored;
}

export async function clearPin() {
  localStorage.removeItem(LS_PIN);
  localStorage.removeItem(LS_CRED);
  localStorage.removeItem(LS_PASSKEYS);
  localStorage.removeItem(LS_DISABLED);
  sessionStorage.removeItem(SS_UNLOCKED);
  await writeSecurityToCloud({ pin_hash: null, pin_salt: null, lock_disabled: false });
  await deleteAllPasskeysFromCloud();
}

export async function skipLock() {
  localStorage.setItem(LS_DISABLED, "1");
  await writeSecurityToCloud({ pin_hash: null, pin_salt: null, lock_disabled: true });
}

export function isWebAuthnSupported() {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    !!navigator.credentials &&
    typeof navigator.credentials.create === "function"
  );
}

export function isFaceIdEnabled() {
  return getCachedPasskeys().length > 0;
}

function getCachedPasskeys() {
  const raw = localStorage.getItem(LS_PASSKEYS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // fall through to legacy single-credential path
    }
  }
  const legacy = localStorage.getItem(LS_CRED);
  return legacy ? [{ credential_id: legacy }] : [];
}

export async function isPlatformAuthenticatorAvailable() {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Register a passkey on the platform authenticator (Face ID / Touch ID /
// Windows Hello). Stores the credential id locally and in user_passkeys so
// the unlock flow can challenge it later from any signed-in device. The PIN
// MUST already be set — Face ID is layered on top, never replacing it.
export async function enableFaceId(label) {
  if (!isWebAuthnSupported()) throw new Error("Biometrics not supported on this device.");
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  const userId = new Uint8Array(16);
  crypto.getRandomValues(userId);

  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Life Dashboard", id: window.location.hostname },
      user: {
        id: userId,
        name: "arin@local",
        displayName: "Arin",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },   // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  });
  if (!cred) throw new Error("Registration cancelled.");
  const id = bufToBase64Url(cred.rawId);

  let row = null;
  if (isSupabaseEnabled()) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const insert = await supabase
        .from("user_passkeys")
        .insert({ user_id: user.id, credential_id: id, label: label ?? null })
        .select("id, credential_id, label")
        .maybeSingle();
      row = insert.data;
    }
  }

  const cached = getCachedPasskeys().filter((p) => p.credential_id !== id);
  cached.push(row || { credential_id: id, label: label ?? null });
  localStorage.setItem(LS_PASSKEYS, JSON.stringify(cached));
  localStorage.setItem(LS_CRED, id);
  return id;
}

export async function unlockWithFaceId() {
  const passkeys = getCachedPasskeys();
  if (passkeys.length === 0) return false;
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: passkeys.map((p) => ({
          id: base64UrlToBuf(p.credential_id),
          type: "public-key",
          transports: ["internal"],
        })),
        userVerification: "required",
        timeout: 60000,
      },
    });
    if (!assertion) return false;
    void markPasskeyUsed(bufToBase64Url(assertion.rawId));
    return true;
  } catch {
    return false;
  }
}

export async function disableFaceId() {
  const id = localStorage.getItem(LS_CRED);
  localStorage.removeItem(LS_CRED);
  localStorage.removeItem(LS_PASSKEYS);
  if (isSupabaseEnabled() && id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("user_passkeys")
        .delete()
        .eq("user_id", user.id)
        .eq("credential_id", id);
    }
  }
}

// ----- cloud sync ----------------------------------------------------------

// Pull user_security + user_passkeys from Supabase into the local cache.
// Safe to call multiple times. Returns the security row if found, else null.
export async function syncFromCloud() {
  if (!isSupabaseEnabled()) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: sec } = await supabase
    .from("user_security")
    .select("pin_hash, pin_salt, lock_disabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (sec) {
    if (sec.pin_hash && sec.pin_salt) {
      localStorage.setItem(LS_PIN, sec.pin_hash);
      localStorage.setItem(LS_SALT, sec.pin_salt);
    } else {
      localStorage.removeItem(LS_PIN);
    }
    if (sec.lock_disabled) localStorage.setItem(LS_DISABLED, "1");
    else localStorage.removeItem(LS_DISABLED);
  }

  const { data: passkeys } = await supabase
    .from("user_passkeys")
    .select("id, credential_id, label")
    .eq("user_id", user.id);
  if (Array.isArray(passkeys)) {
    localStorage.setItem(LS_PASSKEYS, JSON.stringify(passkeys));
    if (passkeys.length > 0) {
      localStorage.setItem(LS_CRED, passkeys[0].credential_id);
    } else {
      localStorage.removeItem(LS_CRED);
    }
  }

  return sec || null;
}

async function writeSecurityToCloud(updates) {
  if (!isSupabaseEnabled()) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("user_security").upsert({
    user_id: user.id,
    ...updates,
    updated_at: new Date().toISOString(),
  });
}

async function deleteAllPasskeysFromCloud() {
  if (!isSupabaseEnabled()) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("user_passkeys").delete().eq("user_id", user.id);
}

async function markPasskeyUsed(credentialId) {
  if (!isSupabaseEnabled()) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("user_passkeys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("credential_id", credentialId);
}
