export function estimateMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export type WordStatus = "overdue" | "due" | "scheduled" | "mastered";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const MASTERED_REPETITIONS = 5;

export function reviewStatus(
  nextReviewAt: Date,
  repetitions: number,
): { status: WordStatus; label: string } {
  if (repetitions >= MASTERED_REPETITIONS) {
    return { status: "mastered", label: "Mastered" };
  }
  
  // Truncate to midnight so time-of-day in nextReviewAt can't skew the day count.
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const startOfDueDay = new Date(nextReviewAt).setHours(0, 0, 0, 0);
  const days = Math.round((startOfDueDay - startOfToday) / DAY_MS);

  if (days < 0) return { status: "overdue", label: "Overdue" };
  if (days === 0) return { status: "due", label: "Due today" };
  if (days === 1) return { status: "scheduled", label: "Tomorrow" };
  if (days < 7) return { status: "scheduled", label: `In ${days} days` };
  if (days < 14) return { status: "scheduled", label: "In a week" };
  return { status: "scheduled", label: `In ${Math.round(days / 7)} weeks` };
}

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < MINUTE_MS) return "just now";
  if (diffMs < HOUR_MS) return `${Math.round(diffMs / MINUTE_MS)}m ago`;
  if (diffMs < DAY_MS) return `${Math.round(diffMs / HOUR_MS)}h ago`;

  const days = Math.round(diffMs / DAY_MS);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}
