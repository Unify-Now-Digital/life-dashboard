// Hostname-based app routing.
//
// The same build serves two hostnames from one Cloudflare Pages project:
//   arin-melvin.lifedashboard.live          → the full dashboard
//   spanish-arin-melvin.lifedashboard.live  → a focused Spanish-practice view
//
// (lifedashboard.live itself is a separate placeholder project.)
//
// isSpanishHost() drives which view <Dashboard> renders. It also matches a
// "?spanish" query flag so the focused view can be previewed on any preview
// deployment URL.
export function isSpanishHost() {
  if (typeof window === "undefined") return false;
  try {
    const h = (window.location.hostname || "").toLowerCase();
    if (h.startsWith("spanish-") || h.startsWith("spanish.")) return true;
    const q = new URLSearchParams(window.location.search);
    return q.has("spanish");
  } catch {
    return false;
  }
}
