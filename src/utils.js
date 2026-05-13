import chalk from "chalk";

export function formatTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mi}`;
}

export function priorityColor(priority, theme) {
  const map = { high: theme.priority_high, med: theme.priority_med, low: theme.priority_low };
  return map[priority] || "white";
}

export function statusColor(status, theme) {
  return status === "done" ? theme.done : theme.pending;
}

export function colorize(text, color) {
  return chalk[color] ? chalk[color](text) : text;
}
