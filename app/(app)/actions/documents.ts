'use server';

import { getCurrentUser } from '@/app/lib/auth/dal';
import { redirect } from 'next/navigation';
import { db } from '@/app/lib/db';
import { documents } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

const TITLE_MAX_LENGTH = 80;

function truncateAtWordBoundary(text: string, maxLength: number) {
  if (text.length < maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const clipped =
    lastSpace > maxLength / 2 ? truncated.slice(0, lastSpace) : truncated;
  return `${clipped.trim()}`;
}

function deriveTitle(text: string) {
  const firstLine = text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine) return 'Untitled';

  // A short line
  if (firstLine.length <= TITLE_MAX_LENGTH) return firstLine;

  // First line is a really paragraph, so use its first sentence
  const sentenceMatch = firstLine.match(/^.*?[.!?](?=\s|$)/);
  const sentence = sentenceMatch ? sentenceMatch[0] : firstLine;

  return truncateAtWordBoundary(sentence, TITLE_MAX_LENGTH);
}

export async function createDocumentFromTextAction(text: string) {
  const content = text.trim();
  if (!content) return;

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [doc] = await db
    .insert(documents)
    .values({
      userId: user.id,
      title: deriveTitle(content),
      content,
    })
    .returning({ id: documents.id });

  redirect(`/read/${doc.id}`);
}

export async function updateDocumentTitleAction(
  documentId: string,
  title: string,
) {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error('Title cannot be empty');
  }

  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [doc] = await db
    .select({ userId: documents.userId })
    .from(documents)
    .where(eq(documents.id, documentId))
    .limit(1);
  if (!doc || doc.userId !== user.id) {
    throw new Error('Not found');
  }

  const finalTitle = truncateAtWordBoundary(trimmed, TITLE_MAX_LENGTH);

  await db
    .update(documents)
    .set({ title: finalTitle })
    .where(eq(documents.id, documentId));

  return finalTitle;
}
