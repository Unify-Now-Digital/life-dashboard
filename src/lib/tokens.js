// Design tokens — change these to re-theme the whole dashboard.
//
// Neutrals (bg/text/border) are driven by CSS variables defined in
// src/index.css so they flip between light and dark mode automatically.
// Accent hexes stay literal — they read correctly in both modes (V2 spec §2).

export const C = {
  accent: "var(--c-accent)", // dark royal blue (theme-aware: lighter in dark mode)
  accentLight: "var(--c-accent-light)",
  accentDark: "var(--c-accent-strong)",
  text: "var(--c-text)",
  textSecondary: "var(--c-text-secondary)",
  textTertiary: "var(--c-text-tertiary)",
  bg: "var(--c-bg)",
  bgSecondary: "var(--c-bg-secondary)",
  bgTertiary: "var(--c-bg-tertiary)",
  card: "var(--c-card)",
  statBg: "var(--c-stat-bg)",
  footerBg: "var(--c-footer-bg)",
  overlay: "var(--c-overlay)",
  border: "var(--c-border)",
  borderStrong: "var(--c-border-strong)",
  success: "#3B6D11",
  danger: "#993C1D",
};

// V2 section accents — section dots / pills. Hardcoded; read in both modes.
export const ACCENT = {
  work: "#534AB7", // work / UD purple
  personal: "#639922", // personal / health green
  finance: "var(--c-accent)", // royal blue (hero)
  priorities: "#E5912A", // priorities amber
};

// Habit dot states — blue scheme (V2 spec §2 / §6).
export const HABIT = {
  hit: "#4C6EF5", // blue
  miss: "#E7A9A9", // soft red
  today: "#4C6EF5", // 1.5px outline ring for "today"
};

// Run-rate badge colour: ≥80% strong blue, <80% muted slate.
export const RUNRATE = { good: "#2A50C8", warn: "#7E8AA3" };

// Category pill backgrounds / text (light fill, dark same-family text).
// Used by task pills (V2 spec §2) and the finance deductible tag.
export const PILL = {
  SM: { bg: "#FAECE7", color: "#993C1D" },
  CM: { bg: "#FAEEDA", color: "#854F0B" },
  UD: { bg: "#EEEDFE", color: "#3C3489" },
  Money: { bg: "#E6F1FB", color: "#185FA5" },
  Admin: { bg: "#F1EFE8", color: "#444441" },
  Health: { bg: "#EAF3DE", color: "#3B6D11" },
  Home: { bg: "#E1F5EE", color: "#0F6E56" },
  deductible: { bg: "#EEEDFE", color: "#3C3489" },
};
export const WORK_PILLS = ["SM", "CM", "UD"];
export const PERSONAL_PILLS = ["Money", "Admin", "Health", "Home"];

export const CAT_STYLES = {
  CM: { bg: "#E6F1FB", color: "#0C447C" },
  Fitness: { bg: "#EAF3DE", color: "#3B6D11" },
  UD: { bg: "#EEEDFE", color: "#3C3489" },
  Personal: { bg: "#FAEEDA", color: "#854F0B" },
  SM: { bg: "#FCEBEB", color: "#791F1F" },
  BODDY: { bg: "#E1F5EE", color: "#0F6E56" },
};
export const CAT_KEYS = Object.keys(CAT_STYLES);

export const AVATAR_STYLES = {
  amber: { bg: "#FAEEDA", color: "#854F0B" },
  purple: { bg: "#EEEDFE", color: "#3C3489" },
  red: { bg: "#FCEBEB", color: "#791F1F" },
  teal: { bg: "#E1F5EE", color: "#0F6E56" },
  blue: { bg: "#E6F1FB", color: "#0C447C" },
};
export const AVATAR_KEYS = Object.keys(AVATAR_STYLES);

export const BIZ_COLORS = ["#E24B4A", "#BA7517", "#185FA5", "#534AB7", "#0F6E56", "#993556"];

// One accent per project — drawn from the existing palette, no new hexes.
export const PROJECT_COLORS = {
  health: "#3B6D11",
  finance: "#185FA5",
  travel: "#0F6E56",
  work: "#534AB7",
  learning: "#854F0B",
  journal: "#791F1F",
  relationships: "#3C3489",
  charity: "#0C447C",
};

// Calendar chip palette — one tone per chip kind. Reuses existing project hues.
export const CHIP_STYLES = {
  trip:     { bg: "#E1F5EE", color: "#0F6E56" }, // travel
  deadline: { bg: "#FCEBEB", color: "#791F1F" }, // journal red
  prompt:   { bg: "#FAEEDA", color: "#854F0B" }, // amber
  personal: { bg: "#EEEDFE", color: "#3C3489" }, // purple
};

// Convert a #rrggbb to rgba(r,g,b,a). Used for soft per-project tints
// so card backgrounds carry the project hue without dominating.
export const tint = (hex, alpha) => {
  const h = (hex || "#000000").replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const QUOTES = [
  '"Discipline equals freedom."',
  '"What gets measured gets managed."',
  '"Slow is smooth, smooth is fast."',
  '"You do not rise to the level of your goals. You fall to the level of your systems."',
  '"The obstacle is the way."',
  '"Hard choices, easy life. Easy choices, hard life."',
  '"Comparison is the thief of joy."',
];

export const styles = {
  page: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    background: C.bg,
    color: C.text,
    minHeight: "100vh",
    // Horizontal padding respects iOS safe-area; bottom clears the floating
    // habits bar plus the home-indicator strip.
    padding: "12px max(14px, env(safe-area-inset-right)) calc(120px + env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left))",
    maxWidth: 1080,
    margin: "0 auto",
    fontSize: 14,
    lineHeight: 1.45,
  },
  card: {
    background: C.bg,
    border: `0.5px solid ${C.border}`,
    borderRadius: 10,
    padding: "10px 12px",
  },
  sectionH: {
    fontSize: 12,
    fontWeight: 500,
    color: C.text,
    margin: "0 0 8px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionSub: {
    fontSize: 10,
    color: C.textTertiary,
    fontWeight: 400,
  },
  stack: { display: "flex", flexDirection: "column", gap: 8 },
  addBtn: {
    width: "100%",
    marginTop: 8,
    border: `0.5px dashed ${C.borderStrong}`,
    background: "transparent",
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: 12,
    color: C.accent,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
