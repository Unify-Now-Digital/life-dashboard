# CLAUDE.md — Life Dashboard

Context for Claude Code when working on this project.

## What this is

Arin's personal life dashboard. Single-page React app, mobile-first, designed to be opened multiple times a day across phone and laptop.

## Stack

- Vite + React 18 (no TypeScript by choice — keep it light)
- No CSS framework — inline styles using design tokens from `src/lib/tokens.js`
- No state library — plain `useState` in `Dashboard.jsx`
- No persistence yet — adding `localStorage` is the next priority

## Conventions

- **Inline styles only.** Don't add CSS files, Tailwind, or styled-components. Use the `C` color object and `styles` helpers from `tokens.js`.
- **One component per file** in `src/components/`.
- **Editable fields** wrap values in the shared `<EditableText />` component from `Editable.jsx`. Don't reinvent inline-editing.
- **Edit mode toggles** use the shared `<EditModeToggle />` and follow the pattern in `Goals.jsx` / `Upcoming.jsx`: a `useState(false)` on the section, with `+ Add` and `×` controls revealed when `editing === true`.
- **Numbers display with tabular-nums** for clean alignment: `fontVariantNumeric: "tabular-nums"`.
- **Soft-blue accent** is `C.accent` (#185FA5). Don't introduce new accent colors without asking Arin.

## Aesthetic

Notion-clean. White background, 0.5px subtle borders, generous whitespace, sentence case throughout. No gradients, no shadows, no emoji in the UI. Italic serif (Georgia) only for the daily quote and the north star block.

## Data shape

Defined in `src/lib/defaultState.js`. The shape matters because it'll become the schema when persistence is added. Don't restructure casually — additive changes only (new fields fine, renames break things).

## Common tasks

- **Add a new section**: create a component in `src/components/`, import in `Dashboard.jsx`, add to the stack in render order. Add any new data to `defaultState.js`.
- **Add a new drill-down panel**: create a file in `src/components/drilldowns/`, register it in `Drilldowns.jsx` (tile + render block), add data to `defaultState.js` under `drilldowns`.
- **Change colors / spacing**: edit `src/lib/tokens.js`. Don't hardcode hex values in components.

## Habit logic (important — not obvious)

Habits are confirmed **retrospectively, one day late**. Each morning you confirm what you did "yesterday" — never "today". This is by design (you can't honestly know what you did today before the day is over, so the streak would be a guess).

Data shape:
- `habitLog: { gym: ["2026-05-03", "2026-05-02"], ... }` — ISO dates of confirmed YES days
- `habitNoLog: { gym: ["2026-05-01"], ... }` — ISO dates of confirmed NO days

Streak calculation lives in `src/lib/habits.js` (`streakFor`). It walks backwards from yesterday counting consecutive YES days, stopping on first NO or first unanswered (where unanswered isn't yesterday — yesterday being unanswered just means "haven't checked in yet today", it shouldn't break the streak yet).

The floating bar (`StickyHabits.jsx`) shows a pulsing ring for any habit with unanswered yesterday. Tap → tiny popover with Yes / No / clear answer. Once answered, the ring solidifies and the streak updates.

Don't refactor this to "did you do it today?" — Arin specifically chose retrospective confirmation.

## Things Arin will probably ask for next

1. **Persistence** — localStorage with daily rollover for priorities/journal/habits-logged. The pattern from the artifact version exists in chat history.
2. **Trend logging UI** — make the sparklines fed by editable arrays.
3. **Supabase migration** — eventually move from localStorage to Supabase for cross-device sync (same stack as Mason App).
4. **Mobile install** — add a manifest.json + service worker so it can be added to home screen.

## What not to do

- Don't add TypeScript without asking. The simplicity is intentional.
- Don't introduce new dependencies without asking.
- Don't refactor for "best practices" — Arin values shipping over architecture purity.
