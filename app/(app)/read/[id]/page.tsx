import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/app/lib/auth/dal';
import { db } from '@/app/lib/db';
import { documents } from '@/app/lib/db/schema';
import { ReadingView } from './components/reading-view';

function estimateMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function getDocument(id: string) {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, id))
    .limit(1);
  return doc;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doc = await getDocument(id);
  return { title: doc ? `${doc.title} - ReadEasy AI` : 'Read - ReadEasy AI' };
}

export default async function ReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/signin');

  const doc = await getDocument(id);
  if (!doc || doc.userId !== user.id) notFound();

  const paragraphs = doc.content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-[680px] px-12 py-12">
      <div className="mb-4 text-[13px] text-text-secondary">
        {estimateMinutes(doc.content)} min read
      </div>

      <h1 className="mb-8 text-pretty font-serif text-[32px] font-bold leading-[1.15] tracking-[-0.01em] text-foreground">
        {doc.title}
      </h1>

      <ReadingView documentId={doc.id} paragraphs={paragraphs} />
    </div>
  );
}
