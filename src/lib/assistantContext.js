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

const MAX_CONTEXT_TASKS = 30;

export function buildAssistantContext(state) {
  const tasks = state?.tasks || [];
  const today = isoDate(new Date());

  const openTasks = tasks.filter((t) => t.status !== "done").slice(0, MAX_CONTEXT_TASKS);
  const decisions = tasks.filter((t) => t.isDecision && t.status !== "done");

  const lines = [];

  lines.push(`Today's date: ${today}.`);

  // Every task line carries its [task_id] so the assistant can reference it
  // for set_task_done — not just the starred/priority ones.
  lines.push(
    openTasks.length
      ? `Open tasks:\n${openTasks
          .map((t) => `- [${t.id}] ${t.text} (${t.column}, due ${todayLabel(t.due)}${t.priority ? ", priority" : ""})`)
          .join("\n")}`
      : "No open tasks right now."
  );

  if (decisions.length) {
    lines.push(`Pending decisions:\n${decisions.map((t) => `- [${t.id}] ${t.text}`).join("\n")}`);
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
        return `- ${h.label} (${h.key}): ${status} today`;
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
