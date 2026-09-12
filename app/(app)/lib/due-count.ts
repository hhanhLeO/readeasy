import { and, count, eq, lt } from "drizzle-orm";
import { db } from "@/app/lib/db";
import { reviews, words } from "@/app/lib/db/schema";

export async function getDueWordCount(userId: string): Promise<number> {
  const startOfTomorrow = new Date();
  startOfTomorrow.setHours(24, 0, 0, 0);

  const [row] = await db
    .select({ count: count() })
    .from(reviews)
    .innerJoin(words, eq(words.id, reviews.wordId))
    .where(and(eq(words.userId, userId), lt(reviews.nextReviewAt, startOfTomorrow)));

  return row?.count ?? 0;
}
