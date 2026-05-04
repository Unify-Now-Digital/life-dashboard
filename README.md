# Life Dashboard

Personal dashboard for tracking priorities, habits, goals, and life across businesses.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Deploy to Vercel

1. Push this folder to a new GitHub repo
2. Go to https://vercel.com/new
3. Import the repo
4. Vercel auto-detects Vite — click Deploy
5. Live URL in ~1 minute

Future changes: commit to GitHub → Vercel auto-redeploys.

## Project structure

```
src/
  Dashboard.jsx              — top-level component, owns state
  main.jsx                   — React entry
  lib/
    tokens.js                — colors, styles, design tokens
    defaultState.js          — initial data shown on first load
  components/
    Header.jsx               — date, greeting, quote
    Priorities.jsx           — top 3 daily
    Streaks.jsx              — habit tiles
    Goals.jsx                — progress bars
    Upcoming.jsx             — next 7 days
    Trends.jsx               — sparklines
    Metrics.jsx              — 2x3 metric grid
    Drilldowns.jsx           — wraps the 5 panels
    NorthStar.jsx            — vision text
    Reflection.jsx           — daily journal
    Editable.jsx             — shared inline-editable text
    drilldowns/
      PanelHeader.jsx
      BusinessesPanel.jsx
      FinancesPanel.jsx
      TravelPanel.jsx
      RelationshipsPanel.jsx
      ReadingPanel.jsx
```

## What works

- Inline tap-to-edit on every text and number field
- Edit mode toggle on each list section (Goals, Upcoming, Businesses, Travel, Relationships, Reading)
- Add and remove items in edit mode
- Habit streak counters
- Priority ticking
- Daily journal

## What's not built yet

- **Persistence** — all changes are lost on page refresh. Add `localStorage` next, or wire to Supabase.
- **Trend logging** — sparklines are static sample data. Need a UI to log daily Spanish minutes and weight.
- **Daily rollover** — priorities, journal, habit-logged-today don't auto-reset at midnight yet (needs persistence first).

## Customising

- **Colors / theme**: edit `src/lib/tokens.js`
- **Initial data**: edit `src/lib/defaultState.js`
- **A specific section**: edit its file in `src/components/`
