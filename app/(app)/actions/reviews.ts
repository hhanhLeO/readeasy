"use server";

import { eq } from "drizzle-orm";
import { db } from "@/app/lib/db";
import { reviews, words } from "@/app/lib/db/schema";
import { getCurrentUser } from "@/app/lib/auth/dal";
import { applySm2, type Rating } from "../lib/srs";

export async function submitReviewAction(reviewId: string, rating: Rating) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const [row] = await db
    .select({
      easeFactor: reviews.easeFactor,
      intervalDays: reviews.intervalDays,
      repetitions: reviews.repetitions,
      userId: words.userId,
    })
    .from(reviews)
    .innerJoin(words, eq(words.id, reviews.wordId))
    .where(eq(reviews.id, reviewId))
    .limit(1);

  if (!row || row.userId !== user.id) throw new Error("Not found");

  const next = applySm2(
    {
      easeFactor: row.easeFactor,
      intervalDays: row.intervalDays,
      repetitions: row.repetitions,
    },
    rating,
  );

  await db
    .update(reviews)
    .set({
      easeFactor: next.easeFactor,
      intervalDays: next.intervalDays,
      repetitions: next.repetitions,
      nextReviewAt: next.nextReviewAt,
      lastReviewedAt: new Date(),
    })
    .where(eq(reviews.id, reviewId));
}
