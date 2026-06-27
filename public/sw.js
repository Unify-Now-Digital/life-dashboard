// Service worker for the Calma (Spanish) PWA.
//
// Scope is "/" (served from the site root). v1 is intentionally minimal — no
// offline caching — its only job is Web Push: show the daily practice
// reminder and open the Spanish view when it's tapped.
//
// The push payload is JSON sent by the `send-practice-reminder` Edge Function:
//   { title, body, url }

self.addEventListener("install", () => {
  // Activate this SW immediately rather than waiting for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of already-open clients on first activation.
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Calma";
  const url = data.url || "/?spanish";
  const options = {
    body: data.body || "Es hora de tu práctica de español.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "spanish-reminder",
    renotify: true,
    data: { url },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/?spanish";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus an existing window if one is already open, otherwise open one.
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(url).catch(() => {});
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
