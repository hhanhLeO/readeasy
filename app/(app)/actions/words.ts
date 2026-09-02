"use server";

import { eq, and, ilike, desc } from "drizzle-orm";
import { getCurrentUser } from "@/app/lib/auth/dal";
import { db } from "@/app/lib/db";
import { words, reviews, documents } from "@/app/lib/db/schema";

export async function saveWordAction({
  documentId,
  word,
  contextSentence,
  meaning,
  phonetic,
}: {
  documentId: string;
  word: string;
  contextSentence: string;
  meaning: string;
  phonetic?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  await db.transaction(async (tx) => {
    const [saved] = await tx
      .insert(words)
      .values({
        userId: user.id,
        documentId,
        word,
        contextSentence,
        meaning,
        phonetic: phonetic || null,
      })
      .returning({ id: words.id });

    // A freshly saved word is due for its first review right away, so the
    // review row can just use the schema defaults (ease 2.5, due now).
    await tx.insert(reviews).values({ wordId: saved.id });
  });
}

export async function deleteWordAction(wordId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const [saved] = await db
    .select({ userId: words.userId })
    .from(words)
    .where(eq(words.id, wordId))
    .limit(1);
  if (!saved || saved.userId !== user.id) throw new Error('Not found');

  // Cascades to the word's review row via reviews.word_id's ON DELETE CASCADE.
  await db.delete(words).where(eq(words.id, wordId));
}

export type SavedMeaning = {
  meaning: string;
  contextSentence: string;
  phonetic: string | null;
  createdAt: Date;
  documentTitle: string | null;
}

export async function getSavedMeaningsAction(word: string): Promise<SavedMeaning[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  return db
    .select({
      meaning: words.meaning,
      contextSentence: words.contextSentence,
      phonetic: words.phonetic,
      createdAt: words.createdAt,
      documentTitle: documents.title
    })
    .from(words)
    .leftJoin(documents, eq(words.documentId, documents.id))
    .where(and(eq(words.userId, user.id), ilike(words.word, word)))
    .orderBy(desc(words.createdAt));
}