// Calendar — feeds upcoming (next 7 days)
//
// Real wiring (when ready):
//   - Google Calendar API: OAuth 2.0, events.list on each selected calendarId
//     timeMin = now, timeMax = now + 7d, singleEvents=true, orderBy=startTime
//   - Or generic CalDAV (Apple iCloud, Fastmail) for non-Google calendars
//   - Map each event → { date: short label, text: summary, cat: from calendar name }
//   - Category mapping lives in tokens.js → CAT_STYLES; calendars without a known
//     mapping fall back to "Personal".

export const id = "calendar";
export const label = "Calendar";
export const feeds = "upcoming";
export const description = "Events from the next 7 days";

export async function connect() {
  throw new Error("Calendar: OAuth not wired. Provide Google client_id or CalDAV creds.");
}

export async function disconnect() {}

// Returns { ok, data, error }. data shape (when implemented):
//   { events: [{ date, text, cat }] }
export async function sync(_opts = {}) {
  return { ok: false, error: "stub", data: null };
}
