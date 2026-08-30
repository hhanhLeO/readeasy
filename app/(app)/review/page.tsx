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

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ word?: string }>;
}) {
  const user = await getCurrentUser();
  const { word: jumpToWordId } = await searchParams;

  // Matches reviewStatus()'s calendar-day bucketing (app/(app)/lib/format.ts):
  // a word due anytime today should already show up here, not just once its
  // exact next_review_at timestamp has passed.
  const startOfTomorrow = new Date();
  startOfTomorrow.setHours(24, 0, 0, 0);

  const rows = user
    ? await db
        .select({
          reviewId: reviews.id,
          wordId: words.id,
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

  // Jumping in from a specific word's "Review" button (only enabled once
  // that word is actually due) — bring it to the front of today's session
  // instead of reordering by nextReviewAt only.
  if (jumpToWordId) {
    const target = rows.findIndex((row) => row.wordId === jumpToWordId);
    if (target > 0) rows.unshift(rows.splice(target, 1)[0]);
  }

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
