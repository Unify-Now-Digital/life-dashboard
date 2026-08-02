// Curated, plain-language self-description for the assistant — what it can
// do, what's changed, and its honest limitations. Surfaced via the
// get_assistant_info read tool for "what can you do" / "what's new" /
// "what can't you do" style questions.
//
// Deliberately NOT a live GitHub API query: that would need a new secret,
// a new external dependency, and would surface raw commit-message noise
// that isn't written for an end-user audience — the opposite of "plain
// terms". This file is hand-curated instead, same as any app's own
// "What's new" section. Keep it current: whenever you ship a change to the
// assistant (Dashboard.jsx's tool executors, the system prompt, or
// AssistantPanel.jsx), add an entry to ASSISTANT_CHANGELOG below. See
// CLAUDE.md's "Common tasks" section.

export const ASSISTANT_CAPABILITIES = [
  "Sees a snapshot of your tasks, habits, and spend every time you open the chat.",
  "Can look deeper on request: a full spend breakdown by category, search for specific transactions, a habit's complete history, tasks beyond what's shown by default, and your weekly review.",
  "Can act for you: mark a task done or reopen it, add a new task, log a habit, or remember something you tell it.",
  "Remembers facts and patterns you've told it or noticed across conversations — not just within one chat.",
  "Surfaces a weekly review on its own — a small badge appears on the assistant button once a week; you choose when to open it, nothing pops up uninvited.",
  "Routes trickier questions (forecasts, comparisons, \"why\" questions, the weekly review) to a smarter model automatically; everyday questions stay fast and cheap.",
  "Tapping a task it mentions jumps straight to that task.",
];

export const ASSISTANT_LIMITATIONS = [
  "Only knows what's in this dashboard — no access to email, ClickUp, Stripe, or any other business tool.",
  "Shows at most your 30 most-open tasks by default; if you have more, it'll say so rather than silently miscounting.",
  "Needs at least 4 weeks of habit and imported spend data before it'll suggest any cross-domain pattern — deliberately cautious about false patterns from too little data.",
  "Text only — no voice input yet.",
  "No push notifications yet — the weekly-review badge only shows once you open the dashboard, it can't reach your phone while it's closed.",
  "Remembers at most ~30 facts about you at a time (oldest drop off first) and keeps roughly the last 40 chat messages, not unlimited history.",
  "Built for one person — this is your own assistant, not a shared or multi-user one.",
];

// Newest first. `pr` is the GitHub PR number, for when you want to go look
// at the actual diff — not meant to be read aloud, just there for reference.
export const ASSISTANT_CHANGELOG = [
  {
    date: "2026-08-02",
    title: "Faster to read, easier to act on",
    description:
      "Replies got much shorter and more direct — built for the small chat window, not a document. Mentioning a task now shows up as a tappable link straight to it, and you'll see a couple of quick suggested follow-ups after each reply.",
    pr: 58,
  },
  {
    date: "2026-08-02",
    title: "Can act, remember, and review your week",
    description:
      "Went from read-only to being able to mark tasks done, add tasks, and log habits for you. Can also look up deeper history on request (like a full month's spend by category), remember things you tell it across conversations, and — once a week — surface a short review of how things went, including any real pattern it noticed (like spend creeping up in weeks you miss the gym). It only ever reports a pattern that's actually there, never a guess.",
    pr: 57,
  },
  {
    date: "2026-07-26",
    title: "Assistant can chat",
    description:
      "Added the floating assistant so you can ask about your tasks, habits, and spend from anywhere in the dashboard. Read-only at first — it could talk about your day, not change anything in it.",
    pr: 56,
  },
];
