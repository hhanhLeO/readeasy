import Link from 'next/link';
import { Logo } from '@/app/components/logo';

const FEATURES = [
  {
    icon: '🔍',
    title: 'Smart word explanations',
    text: 'Hover any word for context-aware explanations, not just dictionary definitions.',
  },
  {
    icon: '🎯',
    title: 'Reads at your level',
    text: 'Articles are automatically rated A1-C2 so you always read at the right difficulty.',
  },
  {
    icon: '🧠',
    title: 'Never forget words',
    text: 'Save words and review them with spaced repetition — words stay in memory longer.',
  },
];

const STEPS = [
  {
    n: 1,
    title: 'Paste any article URL',
    text: 'BBC, VOA, The Guardian, or any English news source.',
  },
  {
    n: 2,
    title: 'Read with AI assistance',
    text: 'Hover words for instant Vietnamese explanations in context.',
  },
  {
    n: 3,
    title: 'Review and remember',
    text: 'Words you save come back as flashcards at the right time.',
  },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Navbar */}
      <header className="flex h-16 items-center justify-between border-b border-border px-12">
        <Logo size="lg" />
        <div className="flex gap-2">
          <Link href="/login" className="btn-ghost btn-md">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary btn-md">
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex min-h-[calc(80vh-4rem)] flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--accent-tint)_0%,white_60%)] px-6 py-16 text-center">
        <span className="mb-6 inline-flex items-center rounded-full bg-accent-tint px-3 py-1 text-xs font-semibold tracking-[0.02em] text-accent-dark">
          Free to start
        </span>
        <h1 className="mb-6 max-w-[900px] text-balance font-serif text-6xl font-bold leading-[1.1] tracking-[-0.02em]">
          Read real English.
          <br />
          Learn naturally.
        </h1>
        <p className="mb-10 max-w-[600px] text-pretty text-[19px] leading-[1.55] text-text-secondary">
          Paste any news article and learn vocabulary in context — with AI
          explanations in Vietnamese, at your level.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary btn-lg">
            Get started for free
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link href="/demo" className="btn-ghost btn-lg">
            See how it works
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[1100px] px-6 py-24">
        <h2 className="mb-14 text-center font-serif text-4xl font-bold tracking-[-0.01em]">
          Everything you need to read smarter
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-white p-7"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-[10px] bg-accent-tint text-xl">
                {f.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm leading-[1.6] text-text-secondary">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-bg-secondary px-6 pt-16 pb-24">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="mb-14 text-center font-serif text-4xl font-bold tracking-[-0.01em]">
            Three steps to fluency
          </h2>
          <div className="grid grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="text-left">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-full border border-border bg-white font-serif text-lg font-bold text-accent">
                  {s.n}
                </div>
                <h3 className="mb-2 text-[17px] font-semibold">{s.title}</h3>
                <p className="text-sm leading-[1.6] text-text-secondary">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="px-6 py-24 text-center">
        <h2 className="mb-6 font-serif text-4xl font-bold tracking-[-0.01em]">
          Start reading smarter today
        </h2>
        <Link href="/signup" className="btn-primary btn-lg mb-3 inline-flex">
          Create free account
        </Link>
      </section>
    </div>
  );
}
