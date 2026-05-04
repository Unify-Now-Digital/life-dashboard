// Default data — what the dashboard shows on first load.
// Edit this to change the initial state when no data is present.

export const defaultState = {
  schemaVersion: 1,
  todayDate: null,
  priorities: [
    { text: "", done: false },
    { text: "", done: false },
    { text: "", done: false },
  ],
  habitsLoggedToday: { gym: false, spanish: false, clean: false, sleep: false },
  habitStreaks: { gym: 0, spanish: 0, clean: 0, sleep: 0 },
  journal: "",
  goals: [
    { id: "sm", label: "Sears Melvin — first 10 orders", current: 2, target: 10 },
    { id: "mason", label: "Mason App — go live", current: 65, target: 100 },
    { id: "spanish", label: "Spanish — reach B2", current: 55, target: 100 },
    { id: "body", label: "Body — cut to 12% BF", current: 70, target: 100 },
  ],
  upcoming: [
    { id: 1, date: "Tue 5", text: "Aylin 1-1 — raise discussion", cat: "CM" },
    { id: 2, date: "Wed 6", text: "Push leg day", cat: "Fitness" },
    { id: 3, date: "Thu 7", text: "Giorgi sync — Mason App release", cat: "UD" },
    { id: 4, date: "Sat 9", text: "Spanish exchange meetup", cat: "Personal" },
  ],
  northStar:
    "Build Sears Melvin into the UK's most trusted memorial mason while running a healthy, multilingual, well-travelled life from Barcelona.",
  metrics: {
    smMTD: "£3,240",
    cmMTD: "£18,420",
    boddyPipeline: "CHF 84k",
    netWorth: "£—",
    daysToTrip: "42",
    nextTripName: "Buenos Aires",
    spanishLevel: "B1+",
  },
  trends: {
    spanishMinutes: [40, 55, 30, 70, 60, 80, 90],
    bodyweight: [83.0, 83.2, 82.8, 82.7, 82.5, 82.5, 82.4],
  },
  drilldowns: {
    businesses: [
      { id: 1, name: "Sears Melvin", color: "#E24B4A", value: "£3,240", meta: "2 orders · 5 enquiries" },
      { id: 2, name: "Churchill", color: "#BA7517", value: "£18,420", meta: "14 orders · 6 permits pending" },
      { id: 3, name: "BODDY", color: "#185FA5", value: "CHF 84k", meta: "12 deals · 3 close this week" },
      { id: 4, name: "Unify Digital", color: "#534AB7", value: "Mason App", meta: "65% to launch" },
    ],
    finances: { income: 8450, spending: 5210, saved: 3240, currency: "€" },
    travel: {
      countries: 12,
      daysAwayYTD: 38,
      trips: [
        { id: 1, name: "Buenos Aires", sub: "Jun 15 – Jul 2 · 17 nights", days: 42 },
        { id: 2, name: "London — Churchill / Matt", sub: "Jul 20 – Jul 24 · 4 nights", days: 77 },
        { id: 3, name: "Tbilisi — UD", sub: "Sep 10 – Sep 17 · 7 nights", days: 129 },
      ],
    },
    relationships: [
      { id: 1, name: "Matt Sears", initials: "MS", color: "amber", last: "3 days ago · WhatsApp", action: "due call", stale: false },
      { id: 2, name: "Aylin", initials: "AY", color: "purple", last: "yesterday · email", action: "1-1 Tue", stale: false },
      { id: 3, name: "Giorgi", initials: "G", color: "red", last: "6 days ago · Slack", action: "overdue", stale: true },
      { id: 4, name: "Mum", initials: "M", color: "teal", last: "9 days ago · phone", action: "overdue", stale: true },
    ],
    reading: [
      { id: 1, title: "The 7 Habits of Highly Effective People", author: "Stephen Covey", progress: 60, sub: "ch. 5 of 8" },
      { id: 2, title: "Mastery", author: "Robert Greene", progress: 22, sub: "ch. 2 of 6" },
      { id: 3, title: "Huberman Lab — Sleep & cognition", author: "Podcast · 1 episode behind", progress: null, sub: "" },
    ],
  },
};

export const nextId = (items) => (items.length ? Math.max(...items.map((i) => i.id || 0)) + 1 : 1);
