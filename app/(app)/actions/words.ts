'use server';

import { getCurrentUser } from '@/app/lib/auth/dal';
import { db } from '@/app/lib/db';
import { words } from '@/app/lib/db/schema';

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
  if (!user) throw new Error('Unauthorized');

  await db.insert(words).values({
    userId: user.id,
    documentId,
    word,
    contextSentence,
    meaning,
    phonetic: phonetic || null,
  });
}
