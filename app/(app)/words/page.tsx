import type { Metadata } from "next";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/app/lib/auth/dal";
import { db } from "@/app/lib/db";
import { words, documents, reviews } from "@/app/lib/db/schema";
import { reviewStatus } from "../lib/format";
import type { WordEntry } from "../lib/types";
import { WordsBrowser } from "./components/words-browser";

export const metadata: Metadata = {
  title: "My Words - ReadEasy AI",
};

export default async function WordsPage() {
  const user = await getCurrentUser();

  const rows = user
    ? await db
        .select({
          id: words.id,
          word: words.word,
          phonetic: words.phonetic,
          meaning: words.meaning,
          documentId: words.documentId,
          documentTitle: documents.title,
          createdAt: words.createdAt,
          nextReviewAt: reviews.nextReviewAt,
          repetitions: reviews.repetitions,
        })
        .from(words)
        .leftJoin(documents, eq(words.documentId, documents.id))
        .leftJoin(reviews, eq(reviews.wordId, words.id))
        .where(eq(words.userId, user.id))
        .orderBy(desc(words.createdAt))
    : [];

  const entries: WordEntry[] = rows.map((row) => {
    // Older words saved before reviews were tracked have no review row —
    // treat them as never-reviewed and immediately due.
    const nextReviewAt = row.nextReviewAt ?? new Date();
    const repetitions = row.repetitions ?? 0;
    const { status, label } = reviewStatus(nextReviewAt, repetitions);

    return {
      id: row.id,
      word: row.word,
      phonetic: row.phonetic,
      meaning: row.meaning,
      documentId: row.documentId,
      documentTitle: row.documentTitle,
      status,
      reviewLabel: label,
      nextReviewAt: nextReviewAt.getTime(),
      createdAt: row.createdAt.getTime(),
    };
  });

  return (
    <div className="mx-auto max-w-[1080px] px-8 py-10 pb-20">
      <WordsBrowser words={entries} />
    </div>
  );
}
