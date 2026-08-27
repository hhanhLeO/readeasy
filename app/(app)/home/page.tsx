import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/app/lib/auth/dal';
import { db } from '@/app/lib/db';
import { documents } from '@/app/lib/db/schema';
import { CEFRBadge } from '../components/cefr-badge';
import { ArticleCard, type Article } from '../components/article-card';
import { ReadingInput } from './components/reading-input';
import { StreakRing } from './components/streak-ring';

export const metadata: Metadata = {
  title: 'Home - ReadEasy AI',
};

const WORDS_DUE = 12;
const STREAK_DAYS = 8;

// Temporary curated picks (News in Levels) until a real recommendation
// feature exists. Only metadata is stored here — reading still goes through
// the app's own extraction, not a copy of their article text.
const RECOMMENDED: Article[] = [
  {
    id: 'ai-does-not-follow-peoples-rules',
    title: "AI does not follow people's rules",
    source: 'News in Levels',
    level: 'B1',
    topic: 'Technology',
    minutes: 4,
    cover: 'linear-gradient(135deg, #4338CA 0%, #0F172A 100%)',
  },
  {
    id: 'animal-sanctuaries-have-problems',
    title: 'Animal sanctuaries have problems',
    source: 'News in Levels',
    level: 'B1',
    topic: 'Environment',
    minutes: 4,
    cover: 'linear-gradient(135deg, #155E75 0%, #0F172A 100%)',
  },
  {
    id: 'spain-wins-the-world-cup',
    title: 'Spain wins the World Cup',
    source: 'News in Levels',
    level: 'B1',
    topic: 'Culture',
    minutes: 3,
    cover: 'linear-gradient(135deg, #B45309 0%, #1E293B 100%)',
  },
];

function estimateMinutes(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const name = user?.username ?? 'there';

  const recentDocuments = user
    ? await db
        .select({
          id: documents.id,
          title: documents.title,
          content: documents.content,
        })
        .from(documents)
        .where(eq(documents.userId, user.id))
        .orderBy(desc(documents.createdAt))
        .limit(2)
    : [];

  const continueReading: Article[] = recentDocuments.map((doc) => ({
    id: doc.id,
    title: doc.title,
    minutes: estimateMinutes(doc.content),
  }));

  return (
    <div className="mx-auto max-w-[760px] px-8 py-10 pb-20">
      {/* Welcome banner */}
      <div className="mb-8 flex items-center gap-5 rounded-xl border border-accent-light bg-[linear-gradient(135deg,var(--accent-tint),white)] p-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-accent-light bg-white text-[22px]">
          👋
        </div>
        <div className="flex-1">
          <div className="mb-0.5 font-semibold text-foreground">
            {greeting()}, {name}!
          </div>
          <div className="text-sm text-text-secondary">
            You have{' '}
            <strong className="text-accent-dark">{WORDS_DUE} words</strong> due
            for review today.
          </div>
        </div>
        <Link
          href="/review"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-all duration-150 hover:-translate-y-px hover:bg-accent-dark hover:shadow-[0_4px_10px_rgba(13,148,136,0.25)]"
        >
          Start review
        </Link>
      </div>

      <ReadingInput />

      {/* Recommended */}
      <Section
        title="Recommended for you"
        right={
          <span className="inline-flex items-center gap-2 text-[13px] text-text-secondary">
            Your level <CEFRBadge level="B1" />
          </span>
        }
      >
        <div className="grid grid-cols-3 gap-4">
          {RECOMMENDED.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      </Section>

      {/* Continue reading */}
      <Section title="Continue reading">
        {continueReading.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {continueReading.map((doc) => (
              <ArticleCard key={doc.id} article={doc} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            No documents yet — paste an article above to get started.
          </p>
        )}
      </Section>

      {/* Today's review */}
      <div className="flex items-center gap-6 rounded-xl border border-accent-light bg-white p-6 shadow-[0_4px_16px_rgba(13,148,136,0.06)]">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent-tint text-[28px]">
          🧠
        </div>
        <div className="flex-1">
          <div className="mb-0.5 text-[17px] font-semibold">
            {WORDS_DUE} words due for review today
          </div>
          <div className="text-sm text-text-secondary">
            Spaced repetition — takes about 6 minutes.
          </div>
        </div>
        <StreakRing days={STREAK_DAYS} />
        <Link
          href="/review"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:-translate-y-px hover:bg-accent-dark hover:shadow-[0_4px_10px_rgba(13,148,136,0.25)]"
        >
          Start session <ArrowRight size={14} strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}

function Section({
  title,
  right,
  children,
  className = '',
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mb-10 ${className}`}>
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
