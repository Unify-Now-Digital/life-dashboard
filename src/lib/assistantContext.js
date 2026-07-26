// Builds the compact context summary sent with every assistant chat message
// (see chatStream.js / api/chat.js). Regenerated fresh on every send from the
// live dashboard state — never stored. Deliberately small: a snapshot, not a
// data dump.

import { financeStats } from "./financeStats.js";
import { FINANCE_SEED } from "./financeSeed.js";
import { isoDate } from "./habits.js";

function todayLabel(due) {
  if (!due) return "no date";
  return due;
}

function financeSummary(finance) {
  const txns = finance?.transactions || [];
  const summary = txns.length > 0 ? financeStats(txns, finance.range, finance.overrides) : FINANCE_SEED;
  const s = summary.stats;
  const top = (summary.categories || [])[0];
  const lines = [
    `Card spend: ~€${s.cardSpend.perMonth.toLocaleString()}/month (net income ~€${s.net.perMonth.toLocaleString()}/month).`,
  ];
  if (top) lines.push(`Biggest spend category: ${top.label} (~€${top.perMonth.toLocaleString()}/month).`);
  return lines.join(" ");
}

export function buildAssistantContext(state) {
  const tasks = state?.tasks || [];
  const today = isoDate(new Date());

  const priorities = tasks.filter((t) => t.priority && t.status !== "done");
  const decisions = tasks.filter((t) => t.isDecision && t.status !== "done");

  const lines = [];

  lines.push(`Today's date: ${today}.`);

  lines.push(
    priorities.length
      ? `Open priority tasks:\n${priorities.map((t) => `- ${t.text} (${t.column}, due ${todayLabel(t.due)})`).join("\n")}`
      : "No open priority tasks right now."
  );

  if (decisions.length) {
    lines.push(`Pending decisions:\n${decisions.map((t) => `- ${t.text}`).join("\n")}`);
  }

  const habits = state?.habits || [];
  if (habits.length) {
    const habitLog = state?.habitLog || {};
    const habitNoLog = state?.habitNoLog || {};
    const habitLines = habits
      .filter((h) => h.active !== false)
      .map((h) => {
        const yes = (habitLog[h.key] || []).includes(today);
        const no = (habitNoLog[h.key] || []).includes(today);
        const status = yes ? "done" : no ? "skipped" : "not logged yet";
        return `- ${h.label}: ${status} today`;
      });
    lines.push(`Habits today:\n${habitLines.join("\n")}`);
  }

  try {
    lines.push(financeSummary(state?.finance));
  } catch {
    // Finance pipeline is best-effort context — never block the chat on it.
  }

  return lines.join("\n\n");
}
