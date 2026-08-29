import type { Metadata } from "next";
import { and, asc, eq, lt } from "drizzle-orm";
import { getCurrentUser } from "@/app/lib/auth/dal";
import { db } from "@/app/lib/db";
import { words, reviews, documents } from "@/app/lib/db/schema";
import type { ReviewCard } from "../lib/types";
import { ReviewSession } from "./components/review-session";

export const metadata: Metadata = {
  title: "Daily Review - ReadEasy AI",
};

export default async function ReviewPage() {
  const user = await getCurrentUser();

  // Matches reviewStatus()'s calendar-day bucketing (app/(app)/lib/format.ts):
  // a word due anytime today should already show up here, not just once its
  // exact next_review_at timestamp has passed.
  const startOfTomorrow = new Date();
  startOfTomorrow.setHours(24, 0, 0, 0);

  const rows = user
    ? await db
        .select({
          reviewId: reviews.id,
          word: words.word,
          phonetic: words.phonetic,
          meaning: words.meaning,
          contextSentence: words.contextSentence,
          documentTitle: documents.title,
        })
        .from(reviews)
        .innerJoin(words, eq(words.id, reviews.wordId))
        .leftJoin(documents, eq(words.documentId, documents.id))
        .where(and(eq(words.userId, user.id), lt(reviews.nextReviewAt, startOfTomorrow)))
        .orderBy(asc(reviews.nextReviewAt))
    : [];

  const cards: ReviewCard[] = rows.map((row) => ({
    reviewId: row.reviewId,
    word: row.word,
    phonetic: row.phonetic,
    meaning: row.meaning,
    contextSentence: row.contextSentence,
    documentTitle: row.documentTitle,
  }));

  return (
    <div className="mx-auto max-w-[640px] px-8 py-10 pb-20">
      <ReviewSession cards={cards} />
    </div>
  );
}
