'use client';

import { useState, type SubmitEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, FileUp, ArrowRight } from 'lucide-react';

const INPUT_MODES = [
  { id: 'text', label: 'Paste text', icon: FileText, soon: false },
  { id: 'url', label: 'Paste URL', icon: Search, soon: true },
  { id: 'pdf', label: 'Upload PDF', icon: FileUp, soon: true },
] as const;

type Mode = (typeof INPUT_MODES)[number]['id'];

const HELPER_TEXT: Record<Mode, string> = {
  url: 'Try BBC Learning English, VOA, or The Guardian.',
  text: 'Paste a paragraph, an essay, or an email - anything in English.',
  pdf: 'PDF and document import is on the roadmap.',
};

export function ReadingInput() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    router.push('/read');
  }

  return (
    <div className="mb-10">
      <label className="mb-2.5 block text-[13px] font-semibold tracking-[0.02em] text-text-secondary">
        READ ANY ARTICLE
      </label>

      <div className="mb-3 flex gap-1.5">
        {INPUT_MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => !m.soon && setMode(m.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-[7px] text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'border-accent bg-accent-tint text-accent-dark'
                  : m.soon
                    ? 'cursor-default border-border text-text-tertiary opacity-70'
                    : 'cursor-pointer border-border text-text-secondary hover:border-border-strong'
              }`}
            >
              <Icon size={14} strokeWidth={2} />
              {m.label}
              {m.soon && (
                <span className="ml-0.5 rounded-full bg-bg-tertiary px-1.5 py-px text-[10px] font-semibold text-text-tertiary">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Text Mode */}
      {mode === 'text' && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
        >
          <textarea
            className="min-h-24 w-full resize-y border-none bg-transparent px-1.5 py-2 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none"
            placeholder="Paste any English text you want to read…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-1 flex justify-end border-t border-border pt-1.5">
            <button
              type="submit"
              disabled={!text.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:-translate-y-px hover:bg-accent-dark hover:shadow-[0_4px_10px_rgba(13,148,136,0.25)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-bg-tertiary disabled:text-text-tertiary disabled:shadow-none"
            >
              Read <ArrowRight size={14} strokeWidth={2} />
            </button>
          </div>
        </form>
      )}

      {/* URL Mode */}
      {mode === 'url' && (
        <form
          onSubmit={handleSubmit}
          className="flex items-center rounded-xl border border-border bg-white p-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-center px-3 text-text-tertiary">
            <Search size={18} strokeWidth={2} />
          </div>
          <input
            className="flex-1 border-none bg-transparent px-0 py-2.5 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none"
            placeholder="Paste an article URL here…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:-translate-y-px hover:bg-accent-dark hover:shadow-[0_4px_10px_rgba(13,148,136,0.25)]"
          >
            Read <ArrowRight size={14} strokeWidth={2} />
          </button>
        </form>
      )}

      {/* PDF Mode */}
      {mode === 'pdf' && (
        <div className="rounded-xl border border-dashed border-border-strong bg-white px-5 py-8 text-center">
          <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-[10px] bg-bg-secondary text-text-tertiary">
            <FileUp size={18} strokeWidth={2} />
          </div>
          <div className="mb-1 font-medium text-text-secondary">
            PDF upload is coming soon
          </div>
          <div className="text-[13px] text-text-tertiary">
            For now, try pasting a URL or the text directly.
          </div>
        </div>
      )}

      <div className="mt-2.5 text-[13px] text-text-tertiary">
        {HELPER_TEXT[mode]}
      </div>
    </div>
  );
}
