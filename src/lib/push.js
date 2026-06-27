// Web Push subscribe/unsubscribe helpers for the Spanish "Calma" reminders.
//
// Push is scoped to the Spanish origin (spanish-arin-melvin.lifedashboard.live):
// the manifest, service worker, and subscribe flow all live here. On iOS/iPadOS,
// Web Push is ONLY delivered to a Home-Screen-installed PWA (iOS 16.4+) — so the
// UI must detect "not installed on iOS" and show Add-to-Home-Screen guidance
// instead of calling subscribe(), which would throw in a Safari tab.
//
// A subscription's keys (endpoint + p256dh + auth) are stored in the
// `push_subscriptions` table (RLS owner-only). The send-practice-reminder Edge
// Function reads them with the service role and sends the encrypted push.

import { supabase } from "./supabase.js";

const VAPID_PUBLIC_KEY = import.meta.env?.VITE_VAPID_PUBLIC_KEY;

// Convert a base64url VAPID public key into the Uint8Array applicationServerKey
// expects.
export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// b64url-encode an ArrayBuffer (subscription keys arrive as ArrayBuffers).
function bufToB64url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    !!VAPID_PUBLIC_KEY
  );
}

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPadOS 13+ reports as Macintosh but is touch-capable.
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

// True when running as an installed PWA (standalone display mode).
export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    navigator.standalone === true
  );
}

// On iOS, push only works once the page is installed to the Home Screen.
export function needsInstall() {
  return isIOS() && !isStandalone();
}

export function permissionState() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

// Whether the SW currently holds a push subscription (so the UI can reflect
// the real browser state, not just a saved preference).
export async function getExistingSubscription() {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

// Request permission, subscribe against the SW, and persist the keys.
// Returns the subscription on success; throws on permission denial / failure.
export async function enablePush() {
  if (!isPushSupported()) throw new Error("Push no soportado en este navegador.");
  if (needsInstall()) throw new Error("Añadí Calma a la pantalla de inicio primero.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permiso de notificaciones denegado.");

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = sub.toJSON();
  const endpoint = json.endpoint || sub.endpoint;
  const p256dh = json.keys?.p256dh || bufToB64url(sub.getKey("p256dh"));
  const auth = json.keys?.auth || bufToB64url(sub.getKey("auth"));

  if (supabase) {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) throw new Error("Iniciá sesión para guardar el recordatorio.");
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent || null,
      },
      { onConflict: "user_id,endpoint" }
    );
    if (error) throw error;
  }
  return sub;
}

// Unsubscribe from the browser and remove the stored row(s).
export async function disablePush() {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  const endpoint = sub?.endpoint;
  if (sub) await sub.unsubscribe().catch(() => {});
  if (supabase && endpoint) {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;
    if (userId) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("endpoint", endpoint);
    }
  }
}
