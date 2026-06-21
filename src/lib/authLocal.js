// Local device lock — PIN + optional WebAuthn (Face ID / Touch ID).
//
// Sits IN FRONT of AuthGate. The dashboard contains personal data; this layer
// keeps it private when the device is shared or stolen. Cloud login (Supabase
// magic link) is unchanged underneath.
//
// Storage:
//   ls.pin         hex SHA-256 of the user's PIN (4-8 digits)
//   ls.salt        random hex used as PIN salt (per-device)
//   ls.webauthnId  base64-url credential id, present iff Face ID is enabled
//   ls.trusted     "1" once this device has been unlocked — a "remember me"
//                  flag so we never re-prompt on load. Cleared only when the
//                  user explicitly locks.
//
// Treat this as a privacy lock, not a cryptographic vault. The state itself
// stays in plain localStorage (so it works offline). The PIN guards the UI.

const LS_PIN = "lifeDashboard:auth:pin";
const LS_SALT = "lifeDashboard:auth:salt";
const LS_CRED = "lifeDashboard:auth:cred";
const LS_DISABLED = "lifeDashboard:auth:disabled";
const LS_TRUSTED = "lifeDashboard:auth:trusted";

// Fired when the user explicitly locks, so LocalLock can switch to the unlock
// screen no matter where the request came from (e.g. the header button).
export const LOCK_EVENT = "lifeDashboard:lock";

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

// Trusted = this device has been unlocked before and hasn't been deliberately
// locked since. Persisted (localStorage) so reopening the app doesn't re-prompt.
export function isUnlocked() {
  return localStorage.getItem(LS_TRUSTED) === "1";
}

export function markUnlocked() {
  localStorage.setItem(LS_TRUSTED, "1");
}

// Explicitly lock: drop the trust flag and tell LocalLock to show the unlock
// screen. Used by the "Lock" control — nothing locks automatically anymore.
export function lockNow() {
  localStorage.removeItem(LS_TRUSTED);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LOCK_EVENT));
  }
}

export async function setPin(pin) {
  const salt = getOrCreateSalt();
  const hash = await sha256Hex(`${salt}:${pin}`);
  localStorage.setItem(LS_PIN, hash);
  localStorage.removeItem(LS_DISABLED);
}

export async function verifyPin(pin) {
  const stored = localStorage.getItem(LS_PIN);
  if (!stored) return false;
  const salt = getOrCreateSalt();
  const hash = await sha256Hex(`${salt}:${pin}`);
  return hash === stored;
}

export function clearPin() {
  localStorage.removeItem(LS_PIN);
  localStorage.removeItem(LS_CRED);
  localStorage.removeItem(LS_DISABLED);
  localStorage.removeItem(LS_TRUSTED);
}

export function skipLock() {
  localStorage.setItem(LS_DISABLED, "1");
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
  return !!localStorage.getItem(LS_CRED);
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
// Windows Hello). Stores the credential id locally so the unlock flow can
// challenge it later. The PIN MUST already be set — Face ID is layered on
// top, never replacing it.
export async function enableFaceId() {
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
  localStorage.setItem(LS_CRED, id);
  return id;
}

export async function unlockWithFaceId() {
  if (!isFaceIdEnabled()) return false;
  const credId = localStorage.getItem(LS_CRED);
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          { id: base64UrlToBuf(credId), type: "public-key", transports: ["internal"] },
        ],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}

export function disableFaceId() {
  localStorage.removeItem(LS_CRED);
}
