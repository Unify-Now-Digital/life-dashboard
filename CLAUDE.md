# CLAUDE.md — Life Dashboard

Context for Claude Code when working on this project.

## What this is

Arin's personal life dashboard. Single-page React app, mobile-first, designed to be opened multiple times a day across phone and laptop.

## Stack

- Vite + React 18 (no TypeScript by choice — keep it light)
- No CSS framework — inline styles using design tokens from `src/lib/tokens.js`
- No state library — plain `useState` in `Dashboard.jsx`
- Persistence: localStorage write-through cache + optional Supabase sync (`src/lib/storage.js`), with versioned `migrate()` (currently schema v12)
- **Light + dark mode.** Neutral colours (bg/text/border) are CSS variables defined in `src/index.css` and exposed through `tokens.js` as `C.bg`, `C.text`, etc. Accent hexes stay literal in `tokens.js` (they read in both modes). Theme is applied via a `data-theme` attribute on `<html>` (see `src/lib/theme.js` + the anti-flash script in `index.html`).

## V2 shell — focus-first (current)

The dashboard has one hub screen and three sub-screens, wired in `Dashboard.jsx` via `state.ui.view`: `focus` (default) | `tasks` | `finance` | `habits`. The idea: promote the 1-3 things that most deserve attention *today*, and put everything else one tap away instead of sharing the screen permanently. Components live in `src/components/v2/`.

- **Daily focus** (`DailyFocusView.jsx`, default landing view) — ranks active habits and open tasks by a severity score (`src/lib/dailyFocus.js`) and headlines the **top 3**, tiered by size (hero + two smaller cards). Colour band (red ≥70 / amber 40-69 / neutral <40 severity) and rank are independent — colour reflects each item's own severity, size reflects its rank, so several items can legitimately be red at once. The hero's ring/stat/decay bar render instantly from local state; its one-sentence AI gloss streams in a beat behind (`src/lib/dailyNudge.js`, `/api/chat` on the "fast" tier, never persisted to `assistant.messages` and never blocking the instant render). A habit with a streak ≥3 gets a "N-day streak" badge (loss-aversion nudge, not shown below that threshold). Habits carry an optional free-text `commitment` ("fluency by September") editable inline from the hero card — when set, it's quoted verbatim in the sentence. Below the top 3, a one-line nav list hands off to Tasks / Finance / Habits with a live count/total each (open+overdue tasks, monthly card spend, habits tracked).
- **Top bar** — on every sub-screen (not on focus itself): a "‹ Focus" back link plus `Tasks` | `Finance` | `Habits` tabs (`Segmented.jsx`) so the three sub-screens stay one tap from each other without detouring through focus every time. `ThemeToggle` is always visible.
- **Tasks view** (`TasksView.jsx`) — flat task list in Work | Personal columns; category pills (`Pill.jsx`); tap a row → `TaskFocus.jsx`. `PrioritiesBar.jsx` (the `Decisions · N` toggle + starred-task chips) lives here now, not globally — priority/overdue tasks still surface on the focus screen via the severity ranking.
- **Finance lens** (`FinanceLens.jsx`) — Revolut **spend** analyzer (not net-worth). Pipeline: `parseRevolutCsv.js → categorise.js → financeStats.js`. Defaults to the seeded 6-month export (`financeSeed.js`) until a CSV is imported. Merchant logos via Clearbit with letter-avatar fallback (`MerchantLogo.jsx`, `merchants.js`).
- **Habits view** (`HabitFooter.jsx` with `docked={false}`) — the full three-horizon detail per habit (`habitStats.js`), rendered in-page instead of a permanent fixed footer. `AssistantButton`/`SpanishButton` (the two floating buttons) only clear the safe area now, not a docked footer, since one is no longer always on screen.

Retired in V2 (data still in state, no longer rendered on the main host): the old collapsible project sections (health, journal, relationships, charity, travel, calendar), the rail (north star, goals rollup, projects nav), TopThree, and the old `Habits`/`StickyHabits` bars. The **Spanish subdomain** (`spanish-arin-melvin.lifedashboard.live`) is untouched.

## Conventions

- **Inline styles only.** Don't add Tailwind or styled-components. Use the `C` colour object, `ACCENT`/`PILL`/`HABIT` maps, and `styles` helpers from `tokens.js`. The single `index.css` exists only to host the theme CSS variables + keyframes — don't add component CSS files.
- **One component per file**; new V2 components go in `src/components/v2/`.
- **Numbers display with tabular-nums** for clean alignment: `fontVariantNumeric: "tabular-nums"`.
- **Accent colours** are the V2 set in `tokens.js` `ACCENT` (work purple `#534AB7`, personal green `#639922`, finance blue `#378ADD`, priorities amber `#EF9F27`). Don't introduce new accent colours without asking Arin.

## Aesthetic

Notion-clean. 0.5px subtle borders, generous whitespace, sentence case throughout. No gradients, no emoji in the UI. Must read correctly in both light and dark mode — drive neutrals from the CSS variables, never hardcode a bg/text hex.

## Data shape

Defined in `src/lib/defaultState.js`; `migrate()` in `storage.js` upgrades older blobs (additive only — new fields fine, renames break things). V2 keys:

- `tasks: [{ id, text, column:'work'|'personal', pill, priority, isDecision, due, meta, status:'open'|'done', notes, createdAt }]` — flat list for the Tasks view. Priorities bar, the Decisions filter, and the focus screen's task-severity scoring all derive from this.
- `finance: { transactions, range:{start,end}, overrides, importedAt }` — the imported Revolut statement for the lens. Empty `transactions` ⇒ the seeded fallback (`financeSeed.js`) renders.
- `ui: { view:'focus'|'tasks'|'finance'|'habits' }` — active screen; `focus` is the default.
- Habits: `habits` (definitions, with `target`/`period`/`commitment`), plus `habitLog`/`habitNoLog` (see below). `commitment` is an optional free-text quote — what Arin is holding himself to on that habit — surfaced on the focus screen's hero card when set.

## Common tasks

- **Add a task category (pill)**: extend `WORK_PILLS`/`PERSONAL_PILLS` + `PILL` in `tokens.js`.
- **Tune finance categorisation**: edit rules/overrides in `categorise.js`; add merchant→domain entries in `merchants.js`.
- **Change colours / spacing**: edit `src/lib/tokens.js` (accents) or `src/index.css` (light/dark neutrals). Don't hardcode hex values in components.
- **Ship a change to the assistant** (a tool, the system prompt, or `AssistantPanel.jsx`): add a dated entry to `ASSISTANT_CHANGELOG` in `src/lib/assistantInfo.js`, written in plain language (it's read back to Arin verbatim via the `get_assistant_info` tool — no live GitHub access, this file *is* the assistant's self-awareness). Update `ASSISTANT_CAPABILITIES`/`ASSISTANT_LIMITATIONS` too if the change adds or removes either.

## Habit logic (important — not obvious)

Data shape:
- `habitLog: { gym: ["2026-05-03", ...], ... }` — ISO dates of confirmed YES days
- `habitNoLog: { gym: ["2026-05-01"], ... }` — ISO dates of confirmed NO days

The footer (`HabitFooter.jsx` + `habitStats.js`) shows three horizons per habit: a rolling 7-day dot strip, a 28-day run-rate vs target occurrences (`weeklyTarget × 4`), and a 28-day smoothed sparkline.

Confirmation was historically **retrospective** (you confirmed "yesterday", never "today"). As of V2, Arin asked to be able to log **today *or* yesterday** — so every dot in the footer (including today's, which carries the outline ring) is tappable and cycles unanswered → yes → no → clear. The legacy retrospective streak helpers still live in `src/lib/habits.js` if needed.

## Daily focus ranking (important — not obvious)

`src/lib/dailyFocus.js` is pure computation, no fetching. It scores every active habit and open task on a comparable ~0-110 scale and sorts descending:

- **Habit severity** = `100 − 28-day run-rate` (reuses `habitStats.js`'s existing run-rate, so a habit with zero recent misses scores near 0, one with zero hits scores near 100).
- **Task severity** = `min(daysOverdue, 4) × 10 + (priority ? 30 : 0) + (isDecision ? 20 : 0) + (dueToday && !overdue ? 15 : 0)`. A task with none of these (no due date, not flagged) scores 0 and never competes for a focus slot.

The ranking is genuinely mixed — there's no reserved slot per category, so on a bad week the top 3 can be all habits (or all tasks). That's a deliberate tradeoff Arin accepted over a guaranteed-slot-per-category rule; if it ever feels wrong in practice, that's the knob to revisit, not the formula's constants.

## Things Arin will probably ask for next

1. **Persistence** — localStorage with daily rollover for priorities/journal/habits-logged. The pattern from the artifact version exists in chat history.
2. **Trend logging UI** — make the sparklines fed by editable arrays.
3. **Supabase migration** — eventually move from localStorage to Supabase for cross-device sync (same stack as Mason App).
4. **Mobile install** — add a manifest.json + service worker so it can be added to home screen.

## What not to do

- Don't add TypeScript without asking. The simplicity is intentional.
- Don't introduce new dependencies without asking.
- Don't refactor for "best practices" — Arin values shipping over architecture purity.
