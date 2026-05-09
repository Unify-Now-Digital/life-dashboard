// Design tokens — change these to re-theme the whole dashboard

export const C = {
  accent: "#185FA5",
  accentLight: "#E6F1FB",
  accentDark: "#0C447C",
  text: "#1F1F1F",
  textSecondary: "#6B6B6B",
  textTertiary: "#9A9A9A",
  bg: "#FFFFFF",
  bgSecondary: "#F7F7F5",
  bgTertiary: "#EFEFEC",
  border: "rgba(0,0,0,0.08)",
  borderStrong: "rgba(0,0,0,0.15)",
  success: "#3B6D11",
  danger: "#993C1D",
};

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
    padding: "24px 20px 120px", // extra bottom padding so floating habit bar doesn't cover content
    maxWidth: 1080,
    margin: "0 auto",
    fontSize: 15,
    lineHeight: 1.5,
  },
  card: {
    background: C.bg,
    border: `0.5px solid ${C.border}`,
    borderRadius: 12,
    padding: "16px 18px",
  },
  sectionH: {
    fontSize: 13,
    fontWeight: 500,
    color: C.text,
    margin: "0 0 12px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionSub: {
    fontSize: 11,
    color: C.textTertiary,
    fontWeight: 400,
  },
  stack: { display: "flex", flexDirection: "column", gap: 16 },
  addBtn: {
    width: "100%",
    marginTop: 10,
    border: `0.5px dashed ${C.borderStrong}`,
    background: "transparent",
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: 13,
    color: C.accent,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
