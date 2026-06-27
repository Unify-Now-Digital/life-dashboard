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

// URL of the full dashboard, from wherever the Spanish view is being served.
// Subdomain (spanish-… / spanish.…) → strip the prefix and go to the main host.
// ?spanish preview on the main host → just drop the query flag (same host).
// `loc` is injectable so this is unit-testable without a real window.
export function mainHref(loc = typeof window !== "undefined" ? window.location : null) {
  if (!loc) return "/";
  try {
    const h = (loc.hostname || "").toLowerCase();
    let mainHost = null;
    if (h.startsWith("spanish-")) mainHost = loc.hostname.slice("spanish-".length);
    else if (h.startsWith("spanish.")) mainHost = loc.hostname.slice("spanish.".length);
    if (mainHost) {
      const port = loc.port ? ":" + loc.port : "";
      return `${loc.protocol}//${mainHost}${port}/`;
    }
    return loc.pathname || "/"; // ?spanish preview → drop the query flag
  } catch {
    return "/";
  }
}
