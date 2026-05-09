import React, { useEffect, useState } from "react";
import { C } from "../lib/tokens";

// Floating page-nav widget. Two stacked buttons — jump to top of the page or
// jump to bottom — visible once the user has scrolled enough that the move
// would meaningfully change view position.
export default function JumpNav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      setVisible(y > 240);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const jump = (where) => {
    const top = where === "top" ? 0 : document.documentElement.scrollHeight;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 96, // sits above the StickyHabits floating bar
        display: "flex",
        flexDirection: "column",
        gap: 6,
        zIndex: 50,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.2s",
      }}
    >
      <button
        onClick={() => jump("top")}
        title="Jump to top"
        aria-label="Jump to top of page"
        style={btnStyle}
      >
        ↑
      </button>
      <button
        onClick={() => jump("bottom")}
        title="Jump to bottom"
        aria-label="Jump to bottom of page"
        style={btnStyle}
      >
        ↓
      </button>
    </div>
  );
}

const btnStyle = {
  width: 36,
  height: 36,
  borderRadius: 18,
  background: C.bg,
  border: `0.5px solid ${C.borderStrong}`,
  fontSize: 16,
  color: C.textSecondary,
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};
