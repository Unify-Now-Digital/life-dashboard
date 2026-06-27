// send-practice-reminder — the evening Web Push nudge for Spanish "Calma".
//
// Called HOURLY by pg_cron (see the schedule migration). The "only at 19:00
// Madrid" rule lives HERE (not in cron) so it's DST-proof: we compute the
// current Madrid date+hour with Intl and act only on the matching hour. A
// per-subscription `last_sent_at` guard prevents duplicate sends within a day.
//
// For each stored push subscription we read the owner's dashboard_state →
// projects.learning.spanish.practice and send ONLY if:
//   • remind.enabled                       (the user opted in)
//   • localHour === (remind.hour ?? 19)    (their configured evening hour)
//   • last_sent_at is not already today    (Madrid)  — dedupe
//   • they have NOT practiced today        (the whole point: a missed-day nudge)
//
// Dead endpoints (404/410) are pruned. Each subscription is wrapped in its own
// try/catch so one bad endpoint never aborts the run. Mirrors passkey/index.ts
// conventions: service-role `admin` client, env via Deno.env, Deno.serve.

import { createClient } from "npm:@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@^0.5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:arinmelvin@gmail.com";

const SPANISH_URL = "https://spanish-arin-melvin.lifedashboard.live/?spanish";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ----- base64url helpers -----------------------------------------------------
function bytesFromB64url(s: string): Uint8Array {
  const norm = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = norm.length % 4 ? "=".repeat(4 - (norm.length % 4)) : "";
  const bin = atob(norm + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Convert the raw (web-push style) base64url VAPID keys into the JWK pair that
// @negrel/webpush's importVapidKeys expects. Public key is the uncompressed EC
// point (0x04 || X || Y); the private key is the 32-byte scalar d.
function vapidJwks(pub: string, priv: string) {
  const p = bytesFromB64url(pub);
  if (p.length !== 65 || p[0] !== 0x04) {
    throw new Error("VAPID_PUBLIC_KEY is not a raw P-256 point (expected 65 bytes, 0x04-prefixed)");
  }
  const x = b64urlFromBytes(p.slice(1, 33));
  const y = b64urlFromBytes(p.slice(33, 65));
  const d = b64urlFromBytes(bytesFromB64url(priv));
  return {
    publicKey: { kty: "EC", crv: "P-256", x, y, ext: true },
    privateKey: { kty: "EC", crv: "P-256", x, y, d, ext: true },
  };
}

// ----- Madrid local date/hour (DST-safe, no offset math) ---------------------
function madridNow(now: Date): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((x) => x.type === t)?.value || "";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0; // some runtimes emit "24" at midnight
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour };
}
function madridDateOf(ts: string | null): string | null {
  if (!ts) return null;
  return madridNow(new Date(ts)).date;
}

// ----- streak / day-number helpers (mirror src/lib/calma.js) -----------------
function addDays(iso: string, d: number): string {
  const dt = new Date(iso + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + d);
  return dt.toISOString().slice(0, 10);
}
function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T00:00:00Z").getTime();
  const b = new Date(toIso + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}
function streakLen(dates: string[], today: string): number {
  const set = new Set(dates || []);
  let cur = today;
  if (!set.has(cur)) cur = addDays(cur, -1); // today not yet practised → count to yesterday
  let n = 0;
  while (set.has(cur)) {
    n++;
    cur = addDays(cur, -1);
  }
  return n;
}

interface Practice {
  remind?: { enabled?: boolean; hour?: number };
  streakDates?: string[];
  frozenDates?: string[];
  todayDate?: string;
  todayXP?: number;
  startDate?: string;
}

function buildPayload(practice: Practice, today: string) {
  const effective = [...(practice.streakDates || []), ...(practice.frozenDates || [])];
  const streak = streakLen(effective, today);
  const dia = practice.startDate ? daysBetween(practice.startDate, today) + 1 : 1;
  const body = streak > 0
    ? `Mantené tu racha de ${streak} ${streak === 1 ? "día" : "días"} — tus tarjetas te esperan. 🔥`
    : "Empezá tu práctica de hoy. 🌱";
  return { title: `Calma · Día ${dia}`, body, url: SPANISH_URL };
}

Deno.serve(async (req) => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  // Only the cron job (service-role bearer) may trigger a send.
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || token !== SERVICE_ROLE) return json({ error: "unauthorized" }, 401);

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return json({ error: "VAPID keys not configured" }, 500);
  }

  const now = new Date();
  const { date: today, hour: localHour } = madridNow(now);

  let appServer: webpush.ApplicationServer;
  try {
    // Default (extractable) import — ApplicationServer needs to export the public
    // application server key for the VAPID header.
    const vapidKeys = await webpush.importVapidKeys(vapidJwks(VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY));
    appServer = await webpush.ApplicationServer.new({
      contactInformation: VAPID_SUBJECT,
      vapidKeys,
    });
  } catch (e) {
    return json({ error: "vapid init failed: " + String((e as Error)?.message || e) }, 500);
  }

  const { data: subs, error: subsErr } = await admin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth, last_sent_at");
  if (subsErr) return json({ error: subsErr.message }, 500);

  // Cache dashboard_state per user — a user may have several device subscriptions.
  const practiceCache = new Map<string, Practice | null>();
  async function practiceFor(userId: string): Promise<Practice | null> {
    if (practiceCache.has(userId)) return practiceCache.get(userId)!;
    const { data } = await admin
      .from("dashboard_state")
      .select("state")
      .eq("user_id", userId)
      .maybeSingle();
    const practice = (data?.state?.projects?.learning?.spanish?.practice as Practice) ?? null;
    practiceCache.set(userId, practice);
    return practice;
  }

  let sent = 0;
  let skipped = 0;
  let pruned = 0;
  const errors: string[] = [];

  for (const row of subs || []) {
    try {
      const practice = await practiceFor(row.user_id);
      if (!practice || !practice.remind?.enabled) { skipped++; continue; }
      if (localHour !== (practice.remind.hour ?? 19)) { skipped++; continue; }
      if (madridDateOf(row.last_sent_at) === today) { skipped++; continue; } // already sent today

      const practicedToday =
        (practice.streakDates || []).includes(today) ||
        (practice.todayDate === today && (practice.todayXP || 0) > 0);
      if (practicedToday) { skipped++; continue; }

      const payload = buildPayload(practice, today);
      const subscriber = appServer.subscribe({
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      });
      await subscriber.pushTextMessage(JSON.stringify(payload), {});

      await admin
        .from("push_subscriptions")
        .update({ last_sent_at: now.toISOString() })
        .eq("id", row.id);
      sent++;
    } catch (e: any) {
      const status = e?.response?.status ?? e?.statusCode ?? e?.status;
      if (e?.isGone === true || status === 404 || status === 410) {
        await admin.from("push_subscriptions").delete().eq("id", row.id);
        pruned++;
      } else {
        errors.push(`${row.id}: ${String(e?.message || e)}`);
      }
    }
  }

  return json({ ok: true, today, localHour, total: (subs || []).length, sent, skipped, pruned, errors });
});
