# CLAUDE.md — Life Dashboard

Context for Claude Code when working on this project.

## What this is

Arin's personal life dashboard. Single-page React app, mobile-first, designed to be opened multiple times a day across phone and laptop.

## Stack

- Vite + React 18 (no TypeScript by choice — keep it light)
- No CSS framework — inline styles using design tokens from `src/lib/tokens.js`
- No state library — plain `useState` in `Dashboard.jsx`
- Persistence: localStorage write-through cache + optional Supabase sync (`src/lib/storage.js`), with versioned `migrate()` (currently schema v8)
- **Light + dark mode.** Neutral colours (bg/text/border) are CSS variables defined in `src/index.css` and exposed through `tokens.js` as `C.bg`, `C.text`, etc. Accent hexes stay literal in `tokens.js` (they read in both modes). Theme is applied via a `data-theme` attribute on `<html>` (see `src/lib/theme.js` + the anti-flash script in `index.html`).

## V2 shell (current)

The dashboard is a **two-view app**, wired in `Dashboard.jsx`. Components live in `src/components/v2/`:

- **Priorities bar** (`PrioritiesBar.jsx`) — permanent, top of every view. Derived from `tasks.filter(t => t.priority && t.status !== 'done')`. Includes a `Decisions · N` toggle.
- **View tabs** — `Tasks` | `Finance` (`Segmented.jsx`), active tab stored in `state.ui.view`.
- **Tasks view** (`TasksView.jsx`) — flat task list in Work | Personal columns; category pills (`Pill.jsx`); tap a row → `TaskFocus.jsx`. The Decisions filter shows only `isDecision` tasks.
- **Finance lens** (`FinanceLens.jsx`) — Revolut **spend** analyzer (not net-worth). Pipeline: `parseRevolutCsv.js → categorise.js → financeStats.js`. Defaults to the seeded 6-month export (`financeSeed.js`) until a CSV is imported. Merchant logos via Clearbit with letter-avatar fallback (`MerchantLogo.jsx`, `merchants.js`).
- **Habit footer** (`HabitFooter.jsx`) — docked across all views; three horizons per habit (`habitStats.js`).

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

- `tasks: [{ id, text, column:'work'|'personal', pill, priority, isDecision, due, meta, status:'open'|'done', notes, createdAt }]` — flat list for the Tasks view. Priorities bar and Decisions filter both derive from this.
- `finance: { transactions, range:{start,end}, overrides, importedAt }` — the imported Revolut statement for the lens. Empty `transactions` ⇒ the seeded fallback (`financeSeed.js`) renders.
- `ui: { view:'tasks'|'finance' }` — active tab.
- Habits: `habits` (definitions, with `target`/`period`), plus `habitLog`/`habitNoLog` (see below).

## Common tasks

- **Add a task category (pill)**: extend `WORK_PILLS`/`PERSONAL_PILLS` + `PILL` in `tokens.js`.
- **Tune finance categorisation**: edit rules/overrides in `categorise.js`; add merchant→domain entries in `merchants.js`.
- **Change colours / spacing**: edit `src/lib/tokens.js` (accents) or `src/index.css` (light/dark neutrals). Don't hardcode hex values in components.

## Habit logic (important — not obvious)

Data shape:
- `habitLog: { gym: ["2026-05-03", ...], ... }` — ISO dates of confirmed YES days
- `habitNoLog: { gym: ["2026-05-01"], ... }` — ISO dates of confirmed NO days

The footer (`HabitFooter.jsx` + `habitStats.js`) shows three horizons per habit: a rolling 7-day dot strip, a 28-day run-rate vs target occurrences (`weeklyTarget × 4`), and a 28-day smoothed sparkline.

Confirmation was historically **retrospective** (you confirmed "yesterday", never "today"). As of V2, Arin asked to be able to log **today *or* yesterday** — so every dot in the footer (including today's, which carries the outline ring) is tappable and cycles unanswered → yes → no → clear. The legacy retrospective streak helpers still live in `src/lib/habits.js` if needed.

## Things Arin will probably ask for next

1. **Persistence** — localStorage with daily rollover for priorities/journal/habits-logged. The pattern from the artifact version exists in chat history.
2. **Trend logging UI** — make the sparklines fed by editable arrays.
3. **Supabase migration** — eventually move from localStorage to Supabase for cross-device sync (same stack as Mason App).
4. **Mobile install** — add a manifest.json + service worker so it can be added to home screen.

## What not to do

- Don't add TypeScript without asking. The simplicity is intentional.
- Don't introduce new dependencies without asking.
- Don't refactor for "best practices" — Arin values shipping over architecture purity.
