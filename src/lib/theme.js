// Theme (light/dark) preference. Stored in localStorage and applied as a
// `data-theme` attribute on <html>, which drives the CSS variables in
// index.css. An inline script in index.html applies the saved theme before
// first paint to avoid a flash; this module keeps it in sync at runtime.

const KEY = "lifeDashboard:theme";

export function getTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  try {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#16171a" : "#ffffff");
}

export function setTheme(theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
  applyTheme(theme);
}
