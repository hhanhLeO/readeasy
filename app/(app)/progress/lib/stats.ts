import "server-only";
import { and, count, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/app/lib/db";
import { documents, reviewLogs, reviews, words } from "@/app/lib/db/schema";
import { MASTERED_REPETITIONS, localDayKey } from "../../lib/format";

export type DueBreakdown = {
  total: number;
  dueToday: number;
  dueThisWeek: number;
  mastered: number;
  scheduledLater: number;
  savedThisWeek: number;
};

// Buckets every saved word into exactly one category
export async function getDueBreakdown(userId: string): Promise<DueBreakdown> {
  const startOfTomorrow = new Date();
  startOfTomorrow.setHours(24, 0, 0, 0);
  const endOfWeek = new Date(startOfTomorrow);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const rows = await db
    .select({
      nextReviewAt: reviews.nextReviewAt,
      repetitions: reviews.repetitions,
      createdAt: words.createdAt,
    })
    .from(words)
    .leftJoin(reviews, eq(reviews.wordId, words.id))
    .where(eq(words.userId, userId));

  const breakdown: DueBreakdown = {
    total: rows.length,
    dueToday: 0,
    dueThisWeek: 0,
    mastered: 0,
    scheduledLater: 0,
    savedThisWeek: 0,
  };

  for (const row of rows) {
    const nextReviewAt = row.nextReviewAt ?? new Date();
    const repetitions = row.repetitions ?? 0;

    if (repetitions >= MASTERED_REPETITIONS) breakdown.mastered += 1;
    else if (nextReviewAt < startOfTomorrow) breakdown.dueToday += 1;
    else if (nextReviewAt < endOfWeek) breakdown.dueThisWeek += 1;
    else breakdown.scheduledLater += 1;

    if (row.createdAt >= weekAgo) breakdown.savedThisWeek += 1;
  }

  return breakdown;
}

export type WeeklyWordCount = { label: string; words: number; current: boolean };

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

// Last 8 calendar weeks (Mon-Sun), including empty ones, oldest first
export async function getWeeklyWordCounts(userId: string): Promise<WeeklyWordCount[]> {
  const rows = await db.select({ createdAt: words.createdAt }).from(words).where(eq(words.userId, userId));

  const currentWeekStart = startOfWeek(new Date());
  const buckets = Array.from({ length: 8 }, (_, i) => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - (7 - i) * 7);
    return { start, count: 0 };
  });

  for (const row of rows) {
    const weekStartTime = startOfWeek(row.createdAt).getTime();
    const bucket = buckets.find((b) => b.start.getTime() === weekStartTime);
    if (bucket) bucket.count += 1;
  }

  return buckets.map((b, i) => ({
    label: b.start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    words: b.count,
    current: i === buckets.length - 1,
  }));
}

// Retention over the trailing window: % of ratings that were Good/Easy
// Returns null when there's nothing logged yet in the window,
// so the UI can show an empty state instead of a misleading 0%.
export async function getRetentionRate(userId: string, windowDays = 30): Promise<number | null> {
  const since = new Date();
  since.setDate(since.getDate() - windowDays);

  const rows = await db
    .select({ rating: reviewLogs.rating })
    .from(reviewLogs)
    .innerJoin(reviews, eq(reviews.id, reviewLogs.reviewId))
    .innerJoin(words, eq(words.id, reviews.wordId))
    .where(and(eq(words.userId, userId), gte(reviewLogs.reviewedAt, since)));

  if (rows.length === 0) return null;

  const passed = rows.filter((r) => r.rating >= 3).length;
  return Math.round((passed / rows.length) * 100);
}

export type ActivityEntry = { key: string; date: Date; icon: string; text: string };

// Merges two approximate activity signals into one feed:
// - "Read": one entry per recently-added document. There's no per-session
//   reading log yet, so createdAt (when the article was added) stands in for
//   "read that day", and the word count is the doc's all-time total, not
//   scoped to that day.
// - "Reviewed": review_logs grouped by calendar day, with a real retention
//   percentage for that day (now possible since each rating is logged).
export async function getRecentActivity(userId: string, limit = 8): Promise<ActivityEntry[]> {
  const docRows = await db
    .select({ id: documents.id, title: documents.title, createdAt: documents.createdAt })
    .from(documents)
    .where(eq(documents.userId, userId))
    .orderBy(desc(documents.createdAt))
    .limit(limit);

  const wordCounts = docRows.length
    ? await db
        .select({ documentId: words.documentId, count: count() })
        .from(words)
        .where(
          and(
            eq(words.userId, userId),
            inArray(
              words.documentId,
              docRows.map((d) => d.id),
            ),
          ),
        )
        .groupBy(words.documentId)
    : [];
  const wordCountByDoc = new Map(wordCounts.map((w) => [w.documentId, w.count]));

  const readEntries: ActivityEntry[] = docRows.map((d) => {
    const savedWords = wordCountByDoc.get(d.id);
    return {
      key: `doc-${d.id}`,
      date: d.createdAt,
      icon: "📖",
      text: `Read "${d.title}"${savedWords ? ` · Saved ${savedWords} words` : ""}`,
    };
  });

  const reviewRows = await db
    .select({ rating: reviewLogs.rating, reviewedAt: reviewLogs.reviewedAt })
    .from(reviewLogs)
    .innerJoin(reviews, eq(reviews.id, reviewLogs.reviewId))
    .innerJoin(words, eq(words.id, reviews.wordId))
    .where(eq(words.userId, userId))
    .orderBy(desc(reviewLogs.reviewedAt))
    .limit(limit * 10); // enough rows to fill `limit` distinct days

  const byDay = new Map<string, { count: number; passed: number; date: Date }>();
  for (const r of reviewRows) {
    const key = localDayKey(r.reviewedAt);
    const bucket = byDay.get(key) ?? { count: 0, passed: 0, date: r.reviewedAt };
    bucket.count += 1;
    if (r.rating >= 3) bucket.passed += 1;
    byDay.set(key, bucket);
  }
  const reviewEntries: ActivityEntry[] = [...byDay.entries()].map(([key, b]) => ({
    key: `review-${key}`,
    date: b.date,
    icon: "🧠",
    text: `Reviewed ${b.count} ${b.count === 1 ? "word" : "words"} · ${Math.round((b.passed / b.count) * 100)}% retention`,
  }));

  return [...readEntries, ...reviewEntries].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
}
