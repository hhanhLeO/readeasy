import { Logo } from '@/app/components/logo';
import { Check } from 'lucide-react';

const CHECKLIST = [
  'Context-aware explanations',
  'Articles matched to your level',
  'Smart flashcards so words actually stick',
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-2 bg-white">
      {/* Left form */}
      <div className="flex flex-col px-14 py-12">
        <Logo />
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>

      {/* Right brand panel */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#0F766E_0%,#0F172A_110%)] p-14 text-white">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.04)_0_2px,transparent_2px_24px)]" />
        <div className="relative">
          <span className="inline-block rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium">
            ReadEasy AI
          </span>
        </div>
        <div className="relative">
          <p className="mb-5 text-pretty font-serif text-4xl leading-[1.3] tracking-[-0.01em]">
            Read real English news and learn the words that matter - explained
            in Vietnamese, right in context.
          </p>
          <p className="max-w-[420px] text-[15px] leading-[1.7] opacity-80">
            Tap any word for an instant explanation, break down tricky
            sentences, and let spaced repetition help you remember what you
            read.
          </p>
        </div>
        <div className="relative flex flex-col gap-3.5">
          {CHECKLIST.map((t) => (
            <div key={t} className="flex items-center gap-3 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/14">
                <Check size={13} strokeWidth={2} />
              </span>
              <span className="opacity-90">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
