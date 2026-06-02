import React, { useState, useEffect, useRef } from "react";
import { C, styles, QUOTES, tint } from "./lib/tokens";
import { defaultState } from "./lib/defaultState";
import { loadFromCache, loadFromCloud, saveState, flushQueue, rollDaily } from "./lib/storage";
import { isSupabaseEnabled } from "./lib/supabase";

import Header from "./components/Header.jsx";
import NorthStar from "./components/NorthStar.jsx";
import Habits from "./components/Habits.jsx";
import StickyHabits from "./components/StickyHabits.jsx";
import UndoToast from "./components/UndoToast.jsx";
import AuthGate from "./components/AuthGate.jsx";
import LocalLock from "./components/LocalLock.jsx";
import PhotoQuickAdd from "./components/PhotoQuickAdd.jsx";
import TopThree from "./components/TopThree.jsx";
import GoalsRollup from "./components/GoalsRollup.jsx";
import Calendar from "./components/Calendar.jsx";
import Projects, { PROJECT_META } from "./components/Projects.jsx";
import ProjectDrilldown from "./components/ProjectDrilldown.jsx";
import JumpNav from "./components/JumpNav.jsx";
import SectionShell from "./components/SectionShell.jsx";

// Projects that get always-rendered sections in the main column, in display
// order beneath the Calendar. Outer card is white with a coloured
// left-border; inner subcards carry the project tint. Travel is the only
// project still rendered as an on-demand drilldown.
const SECTIONS = [
  { key: "finance", defaultOpen: true },
  { key: "work", defaultOpen: true },
  { key: "health", defaultOpen: true },
  { key: "learning", defaultOpen: false },
  { key: "journal", defaultOpen: false },
  { key: "relationships", defaultOpen: false },
  { key: "charity", defaultOpen: false },
];
const SECTION_KEYS = SECTIONS.map((s) => s.key);


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

function MainSection({ projectKey, expanded, onToggle, state, setState }) {
  const meta = PROJECT_META.find((m) => m.key === projectKey);
  const color = meta?.color || C.accent;
  return (
    <SectionShell
      id={`section-${projectKey}`}
      icon={<ProjectIcon projectKey={projectKey} color={color} size={18} />}
      label={meta?.label || projectKey}
      color={color}
      expanded={expanded}
      onToggle={onToggle}
    >
      <ProjectDrilldown
        projectKey={projectKey}
        state={state}
        setState={setState}
        onClose={onToggle}
        embedded
      />
    </SectionShell>
  );
}

// Small pill that flips the side-panel between docked and floating modes.
function RailModeToggle({ mode, onClick }) {
  return (
    <button
      onClick={onClick}
      title={mode === "dock" ? "Float the panel (full-width page)" : "Dock the panel"}
      style={{
        background: "transparent",
        border: `0.5px solid ${C.border}`,
        borderRadius: 6,
        padding: "3px 9px",
        fontSize: 11,
        color: C.textSecondary,
        cursor: "pointer",
        fontFamily: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      {mode === "dock" ? "float ▸" : "◂ dock"}
    </button>
  );
}

// Floating side panel: collapsed to a thin handle on the right edge, expands
// on hover. Click the handle to pin it open. The page's main column runs
// full-width underneath.
function FloatingRail({ children, onDock, width = 300 }) {
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const show = hover || pinned;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "fixed",
        top: 84,
        right: 0,
        height: "calc(100vh - 104px)",
        display: "flex",
        alignItems: "flex-start",
        zIndex: 90,
      }}
    >
      {/* Edge handle — always visible, click to pin/unpin */}
      <button
        onClick={() => setPinned((p) => !p)}
        title={pinned ? "Unpin panel" : "Pin panel open"}
        style={{
          alignSelf: "center",
          width: 24,
          height: 72,
          border: `0.5px solid ${C.border}`,
          borderRight: "none",
          borderRadius: "8px 0 0 8px",
          background: C.bg,
          color: pinned ? C.accent : C.textSecondary,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 13,
          boxShadow: "-2px 2px 10px rgba(0,0,0,0.05)",
          flexShrink: 0,
        }}
      >
        {show ? "›" : "‹"}
      </button>

      {/* Sliding panel */}
      <div
        style={{
          width: show ? width : 0,
          height: "100%",
          overflow: "hidden",
          transition: "width 0.18s ease",
        }}
      >
        <div
          style={{
            width,
            height: "100%",
            boxSizing: "border-box",
            overflowY: "auto",
            background: C.bg,
            border: `0.5px solid ${C.border}`,
            borderRight: "none",
            borderRadius: "10px 0 0 10px",
            boxShadow: "-6px 0 20px rgba(0,0,0,0.07)",
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {pinned ? "pinned" : "hover panel"}
            </span>
            <RailModeToggle mode="float" onClick={onDock} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function useViewport() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);
  return {
    width,
    isDesktop: width >= 860,
    isWide: width >= 1100,
    isCompact: width < 380,
  };
}

export default function Dashboard() {
  const [state, setStateRaw] = useState(() => rollDaily(loadFromCache() || defaultState));
  const { isDesktop, isWide } = useViewport();
  // On-demand drilldown for projects without a permanent MainSection (Travel).
  const [openProject, setOpenProjectRaw] = useState(null);
  // Per-section expanded state for the always-visible MainSections, keyed by
  // project key. Initialised from each section's defaultOpen flag.
  const [sectionOpen, setSectionOpen] = useState(() =>
    SECTIONS.reduce((acc, s) => {
      acc[s.key] = !!s.defaultOpen;
      return acc;
    }, {})
  );

  // Desktop side-panel mode: "float" (main full-width, rail pops out on hover)
  // or "dock" (classic two-column). Persisted as a UI preference.
  const [railMode, setRailModeRaw] = useState(() => {
    try {
      return localStorage.getItem("lifeDashboard:railMode") || "float";
    } catch {
      return "float";
    }
  });
  const setRailMode = (m) => {
    setRailModeRaw(m);
    try {
      localStorage.setItem("lifeDashboard:railMode", m);
    } catch {
      /* ignore */
    }
  };

  // Project navigation: tapping a rail card or floating pill should expand
  // the matching MainSection (if it has one) and scroll to it; otherwise it
  // opens the on-demand drilldown.
  const setOpenProject = (key) => {
    if (key && SECTION_KEYS.includes(key)) {
      setSectionOpen((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        const el = document.getElementById(`section-${key}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 30);
    } else {
      setOpenProjectRaw(key);
    }
  };

  const toggleSection = (key) =>
    setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  // Hydrate from cloud once on mount. The cloud row is the source of truth:
  // adopt it if present, and only seed the cloud from local state when no row
  // exists yet. Critically, we never write to the cloud BEFORE reading it —
  // doing so could clobber existing data with the local (possibly seed) state.
  useEffect(() => {
    let alive = true;
    loadFromCloud().then((cloud) => {
      if (!alive) return;
      if (cloud) {
        const rolled = rollDaily(cloud);
        setStateRaw(rolled);
        if (rolled !== cloud) saveState(rolled); // persist only if rollover changed it
      } else {
        // No cloud row yet — back up whatever we have locally from now on.
        saveState(state);
      }
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

  const closeDrilldown = () => setOpenProjectRaw(null);

  // Only render the on-demand drilldown for projects that DON'T have a
  // permanent collapsible MainSection. Travel is the lone holdout.
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
      expanded={!!sectionOpen[s.key]}
      onToggle={() => toggleSection(s.key)}
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
      <Habits habits={state.habits} habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
      <Calendar state={state} setState={setState} onOpenProject={setOpenProject} />
      {mainSections}
      {drilldownPanel}
    </div>
  );

  // Shared rail content, reused by both the docked column and the floating
  // pop-out panel.
  const railContent = (
    <>
      <NorthStar value={state.northStar} onChange={setNorthStar} compact />
      <GoalsRollup state={state} onOpenProject={setOpenProject} />
      <Projects
        state={state}
        openOverride={openProject}
        setOpenOverride={setOpenProject}
        layout="rail"
      />
    </>
  );

  const dockedRail = (
    <aside
      style={{
        alignSelf: "start",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <RailModeToggle mode="dock" onClick={() => setRailMode("float")} />
      </div>
      {railContent}
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
      <Habits habits={state.habits} habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
      <Calendar state={state} setState={setState} onOpenProject={setOpenProject} />
      {mainSections}
      {drilldownPanel}
      <Projects
        state={state}
        openOverride={openProject}
        setOpenOverride={setOpenProject}
        layout="float"
      />
    </div>
  );

  return (
    <LocalLock>
    <AuthGate>
      <div style={styles.page}>
        <Header today={today} dayOfYear={dayOfYear} quote={quote} />

        {!isSupabaseEnabled() && (
          <div
            style={{
              background: "#FDF6E3",
              border: "0.5px solid #E6D9A8",
              color: "#7A5C00",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            Local only — changes are saved on this device but <strong>not backed up</strong>.
            Set the Supabase env vars to sync across devices.
          </div>
        )}

        {isDesktop ? (
          railMode === "dock" ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `minmax(0, 1fr) ${isWide ? 300 : 260}px`,
                gap: isWide ? 24 : 16,
                alignItems: "start",
              }}
            >
              {mainColumn}
              {dockedRail}
            </div>
          ) : (
            <>
              {mainColumn}
              <FloatingRail width={isWide ? 320 : 280} onDock={() => setRailMode("dock")}>
                {railContent}
              </FloatingRail>
            </>
          )
        ) : (
          mobileLayout
        )}

        <StickyHabits habits={state.habits} habitLog={state.habitLog} habitNoLog={state.habitNoLog} onConfirm={confirmHabit} />
        <PhotoQuickAdd
          setState={setState}
          onCreated={() => setOpenProject("journal")}
        />
        {isDesktop && <JumpNav />}
        {undo && <UndoToast label={undo.label} onUndo={undo.onUndo} />}
      </div>
    </AuthGate>
    </LocalLock>
  );
}
