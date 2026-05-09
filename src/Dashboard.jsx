import React, { useState, useEffect, useRef } from "react";
import { C, styles, QUOTES, tint } from "./lib/tokens";
import { defaultState } from "./lib/defaultState";
import { loadFromCache, loadFromCloud, saveState, flushQueue } from "./lib/storage";

import Header from "./components/Header.jsx";
import NorthStar from "./components/NorthStar.jsx";
import Habits from "./components/Habits.jsx";
import StickyHabits from "./components/StickyHabits.jsx";
import UndoToast from "./components/UndoToast.jsx";
import AuthGate from "./components/AuthGate.jsx";
import TopThree from "./components/TopThree.jsx";
import GoalsRollup from "./components/GoalsRollup.jsx";
import Calendar from "./components/Calendar.jsx";
import Projects, { PROJECT_META } from "./components/Projects.jsx";
import ProjectDrilldown from "./components/ProjectDrilldown.jsx";
import JumpNav from "./components/JumpNav.jsx";

// Projects that get always-rendered sections in the main column, in display
// order beneath Habits. Each section is a colour-tinted card with a
// prominent collapse/expand button. When expanded, the project's subcards
// show; tap a subcard to expand its details inline.
const SECTIONS = [
  { key: "work", defaultOpen: true },
  { key: "finance", defaultOpen: true },
  { key: "health", defaultOpen: false },
];
const SECTION_KEYS = SECTIONS.map((s) => s.key);

// Shared prominent toggle — a bordered chip with a chevron. Used by
// MainSection (and similar styling lives in Calendar / Objectives so the
// affordance feels consistent across the dashboard).
function SectionToggle({ expanded, onClick, color }) {
  return (
    <button
      onClick={onClick}
      aria-expanded={expanded}
      title={expanded ? "Collapse" : "Expand"}
      style={{
        background: expanded ? color : "transparent",
        color: expanded ? "#fff" : color,
        border: `1px solid ${color}`,
        borderRadius: 999,
        padding: "4px 12px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
        cursor: "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        minHeight: 28,
      }}
    >
      {expanded ? "Collapse" : "Expand"}
      <span
        aria-hidden="true"
        style={{
          fontSize: 10,
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.15s",
          display: "inline-block",
        }}
      >
        ▾
      </span>
    </button>
  );
}

// Inline SVG icon per project. Used as the section identifier instead of a
// text label so the MainSection header takes minimal vertical space.
function ProjectIcon({ projectKey, color, size = 18 }) {
  const stroke = color || C.text;
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    style: { display: "block", flexShrink: 0 },
  };
  switch (projectKey) {
    case "work":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="1.5" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M3 12h18" />
        </svg>
      );
    case "finance":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9.5c-.7-.9-1.8-1.4-3-1.4-2 0-3.5 1.4-3.5 3.5s1.5 3.5 3.5 3.5c1.2 0 2.3-.5 3-1.4" />
          <path d="M8.5 11h5" />
          <path d="M8.5 13h5" />
        </svg>
      );
    case "health":
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.5-9-9a5.5 5.5 0 0 1 9.5-3.5A5.5 5.5 0 0 1 21 12c-2 4.5-9 9-9 9z" />
        </svg>
      );
    case "travel":
      return (
        <svg {...common}>
          <path d="M2 12l9 2 4 7 2-1-2-7 5-5a2 2 0 0 0-3-3l-5 5-7-2-1 2 7 4z" />
        </svg>
      );
    case "learning":
      return (
        <svg {...common}>
          <path d="M3 6a2 2 0 0 1 2-2h6v15H5a2 2 0 0 1-2-2z" />
          <path d="M21 6a2 2 0 0 0-2-2h-6v15h6a2 2 0 0 0 2-2z" />
        </svg>
      );
    case "journal":
      return (
        <svg {...common}>
          <path d="M14 3l7 7-11 11H3v-7z" />
          <path d="M13 4l7 7" />
        </svg>
      );
    case "relationships":
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="3" />
          <path d="M3 19a6 6 0 0 1 12 0" />
          <circle cx="17" cy="8" r="2.5" />
          <path d="M14.5 14a4.5 4.5 0 0 1 7 4" />
        </svg>
      );
    case "charity":
      return (
        <svg {...common}>
          <path d="M3 11h18v9H3z" />
          <path d="M3 7h18v4H3z" />
          <path d="M12 7v13" />
          <path d="M8 7c0-2 1.5-3.5 4-3.5S16 5 16 7" />
        </svg>
      );
    default:
      return (
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: color,
          }}
          aria-hidden="true"
        />
      );
  }
}

function MainSection({ projectKey, defaultOpen, state, setState }) {
  const meta = PROJECT_META.find((m) => m.key === projectKey);
  const color = meta?.color || C.accent;
  const [expanded, setExpanded] = React.useState(defaultOpen);

  return (
    <div
      id={`section-${projectKey}`}
      style={{
        background: tint(color, 0.04),
        border: `0.5px solid ${tint(color, 0.22)}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 10,
        padding: "8px 12px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: expanded ? 8 : 0,
        }}
      >
        <ProjectIcon projectKey={projectKey} color={color} size={18} />
        <SectionToggle
          expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          color={color}
        />
      </div>
      {expanded && (
        <ProjectDrilldown
          projectKey={projectKey}
          state={state}
          setState={setState}
          onClose={() => setExpanded(false)}
          embedded
        />
      )}
    </div>
  );
}

function useIsDesktop(breakpoint = 860) {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isDesktop;
}

export default function Dashboard() {
  const [state, setStateRaw] = useState(() => loadFromCache() || defaultState);
  const isDesktop = useIsDesktop();
  // Drilldown closed by default so the dashboard fits one viewport. Tap any
  // project card to expand it beneath Top 3; only one can be open at a time.
  const [openProject, setOpenProject] = useState(null);

  // Hydrate from cloud once on mount, reconcile if newer.
  useEffect(() => {
    let alive = true;
    loadFromCloud().then((cloud) => {
      if (alive && cloud) setStateRaw(cloud);
    });
    flushQueue();
    const onFocus = () => flushQueue();
    window.addEventListener("focus", onFocus);
    return () => { alive = false; window.removeEventListener("focus", onFocus); };
  }, []);

  // Wrap setState so every change persists.
  const setState = (updater) => {
    setStateRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveState(next);
      return next;
    });
  };

  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today - start) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];

  const [undo, setUndo] = useState(null);
  const undoTimerRef = useRef(null);
  useEffect(
    () => () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current); },
    []
  );

  const enqueueUndo = (entry) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndo(null), 5000);
    setUndo(entry);
  };

  const confirmHabit = (habit, dateISO, answer) =>
    setState((s) => {
      const yes = (s.habitLog[habit] || []).filter((d) => d !== dateISO);
      const no = (s.habitNoLog[habit] || []).filter((d) => d !== dateISO);
      if (answer === "yes") yes.push(dateISO);
      if (answer === "no") no.push(dateISO);
      return {
        ...s,
        habitLog: { ...s.habitLog, [habit]: yes },
        habitNoLog: { ...s.habitNoLog, [habit]: no },
      };
    });

  const setNorthStar = (text) => setState((s) => ({ ...s, northStar: text }));

  // ---- Render -------------------------------------------------------------

  const closeDrilldown = () => setOpenProject(null);

  // Only render the on-demand drilldown for projects that DON'T have a
  // permanent collapsible section in the main column.
  const drilldownPanel =
    openProject && !SECTION_KEYS.includes(openProject) ? (
      <div id="project-drilldown-anchor">
        <ProjectDrilldown
          state={state}
          setState={setState}
          projectKey={openProject}
          onClose={closeDrilldown}
        />
      </div>
    ) : null;

  const mainSections = SECTIONS.map((s) => (
    <MainSection
      key={s.key}
      projectKey={s.key}
      defaultOpen={s.defaultOpen}
      state={state}
      setState={setState}
    />
  ));

  const mainColumn = (
    <div style={styles.stack}>
      <TopThree
        state={state}
        setState={setState}
        onOpenProject={setOpenProject}
      />
      <Habits habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
      {mainSections}
      {drilldownPanel}
      <Calendar state={state} onOpenProject={setOpenProject} />
    </div>
  );

  const rightRail = (
    <aside
      style={{
        // Let the rail flow naturally — it scrolls with the page once it
        // exceeds the viewport, so all 8 cards (incl. Learning at the bottom)
        // remain reachable.
        alignSelf: "start",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <NorthStar value={state.northStar} onChange={setNorthStar} compact />
      <GoalsRollup state={state} onOpenProject={setOpenProject} />
      <Projects
        state={state}
        openOverride={openProject}
        setOpenOverride={setOpenProject}
        layout="rail"
      />
    </aside>
  );

  const mobileLayout = (
    <div style={styles.stack}>
      <NorthStar value={state.northStar} onChange={setNorthStar} compact />
      <GoalsRollup state={state} onOpenProject={setOpenProject} />
      <TopThree
        state={state}
        setState={setState}
        onOpenProject={setOpenProject}
      />
      <Habits habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
      {mainSections}
      {drilldownPanel}
      <Calendar state={state} onOpenProject={setOpenProject} />
      <Projects
        state={state}
        openOverride={openProject}
        setOpenOverride={setOpenProject}
        layout="float"
      />
    </div>
  );

  return (
    <AuthGate>
      <div style={styles.page}>
        <Header today={today} dayOfYear={dayOfYear} quote={quote} />

        {isDesktop ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 280px",
              gap: 20,
              alignItems: "start",
            }}
          >
            {mainColumn}
            {rightRail}
          </div>
        ) : (
          mobileLayout
        )}

        <StickyHabits habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
        {isDesktop && <JumpNav />}
        {undo && <UndoToast label={undo.label} onUndo={undo.onUndo} />}
      </div>
    </AuthGate>
  );
}
