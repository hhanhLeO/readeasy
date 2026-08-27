'use client';

import { useEffect, useState } from 'react';
import { useFloating, offset, flip, shift } from '@floating-ui/react';
import { Check, X, BookmarkPlus } from 'lucide-react';
import { saveWordAction } from '@/app/(app)/actions/words';
import type { WordLookup } from '@/app/lib/dictionary/word-lookup';

export function WordPopup({
  word,
  sentence,
  rect,
  documentId,
  onDismiss,
  onSaved,
}: {
  word: string;
  sentence: string;
  rect: DOMRect;
  documentId: string;
  onDismiss: () => void;
  onSaved: (word: string) => void;
}) {
  const [lookup, setLookup] = useState<WordLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [offset(8), flip(), shift({ padding: 12 })],
  });

  useEffect(() => {
    refs.setPositionReference({ getBoundingClientRect: () => rect });
  }, [rect, refs]);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, sentence }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('lookup failed');
        return res.json() as Promise<WordLookup>;
      })
      .then((data) => {
        if (!cancelled) setLookup(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [word, sentence]);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      const floating = refs.floating.current;
      if (floating && !floating.contains(e.target as Node)) {
        onDismiss();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss();
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
    // refs.floating is a stable object identity from floating-ui and isn't reactive state,
    // so it's intentionally left out here (adding it trips the react-hooks/refs rule instead).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDismiss]);

  async function handleSave() {
    if (!lookup || saving || saved) return;
    setSaving(true);
    try {
      await saveWordAction({
        documentId,
        word,
        contextSentence: sentence,
        meaning: lookup.meaning,
        phonetic: lookup.phonetic,
      });
      setSaved(true);
      onSaved(word);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      // eslint-disable-next-line react-hooks/refs -- setFloating is floating-ui's callback ref for the positioned element, not a `.current` read
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-[60] w-80 overflow-hidden rounded-xl border border-border bg-white shadow-lg"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <div className="text-base font-bold text-foreground">{word}</div>
          {lookup && (
            <div className="mt-0.5 font-mono text-[13px] text-text-secondary">
              {lookup.phonetic}
            </div>
          )}
        </div>
        {lookup && (
          <span className="rounded bg-bg-tertiary px-2 py-0.5 text-[11px] font-medium text-text-secondary italic">
            {lookup.partOfSpeech}
          </span>
        )}
      </div>

      <div className="border-b border-border px-4 py-3 text-[13px] leading-normal">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3.5 w-2/3 animate-pulse rounded bg-bg-tertiary" />
            <div className="h-3 w-full animate-pulse rounded bg-bg-tertiary" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-bg-tertiary" />
          </div>
        ) : error || !lookup ? (
          <div className="text-danger">
            Couldn&apos;t look up this word. Try again.
          </div>
        ) : (
          <>
            <div className="mb-2 font-medium text-foreground">
              {lookup.meaning}
            </div>
            <div className="text-text-secondary">{lookup.explanation}</div>
          </>
        )}
      </div>

      <div className="flex gap-2 bg-bg-secondary px-3 py-2.5">
        <button
          type="button"
          onClick={handleSave}
          disabled={!lookup || saving || saved}
          className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed ${
            saved
              ? 'border border-border-strong text-foreground'
              : 'bg-accent text-white hover:bg-accent-dark disabled:bg-bg-tertiary disabled:text-text-tertiary'
          }`}
        >
          {saved ? (
            <>
              <Check size={14} /> Saved
            </>
          ) : (
            <>
              <BookmarkPlus size={14} /> {saving ? 'Saving…' : 'Save word'}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-bg-tertiary"
        >
          <X size={14} /> Dismiss
        </button>
      </div>
    </div>
  );
}
