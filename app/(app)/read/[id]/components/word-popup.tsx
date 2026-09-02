'use client';

import { useEffect, useState, useRef } from 'react';
import { useFloating, offset, flip, shift } from '@floating-ui/react';
import { Check, X, BookmarkPlus, Bookmark, Sparkles } from 'lucide-react';
import { getSavedMeaningsAction, saveWordAction, type SavedMeaning } from '@/app/(app)/actions/words';
import { formatRelativeTime } from '@/app/(app)/lib/format';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const lookupPromiseRef = useRef<Promise<WordLookup | null> | null>(null);
  const unmountedRef = useRef(false);

  const [priors, setPriors] = useState<SavedMeaning[] | null>(null);
  const [mode, setMode] = useState<'prior' | 'fresh'>('fresh');
  const [confirmed, setConfirmed] = useState(false);

  const { refs, floatingStyles } = useFloating({
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [offset(8), flip(), shift({ padding: 12 })],
  });

  useEffect(() => {
    refs.setPositionReference({ getBoundingClientRect: () => rect });
  }, [rect, refs]);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    }
  }, []);

  function ensureLookup(): Promise<WordLookup | null> {
    if (lookupPromiseRef.current) return lookupPromiseRef.current;
    
    setLoading(true);
    setError(false);

    const promise = fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, sentence }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('lookup failed');
        return res.json() as Promise<WordLookup>;
      })
      .then((data) => {
        if (!unmountedRef.current) setLookup(data);
        return data;
      })
      .catch(() => {
        if (!unmountedRef.current) setError(true);
        return null;
      })
      .finally(() => {
        if (!unmountedRef.current) setLoading(false);
      });
    
    lookupPromiseRef.current = promise;
    return promise;
  }

  useEffect(() => {
    let cancelled = false;

    getSavedMeaningsAction(word).then((data) => {
      if (cancelled) return;
      setPriors(data);
      if (data.length > 0) setMode('prior');
      else ensureLookup();
    });

    return () => {
      cancelled = true;
    };
  }, [word]);

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

  function confirmFits() {
    setConfirmed(true);
    setTimeout(onDismiss, 900);
  }

  const hasPriors = !!priors && priors.length > 0;
  const phonetic = lookup?.phonetic || priors?.[0]?.phonetic;

  return (
    <div
      // eslint-disable-next-line react-hooks/refs -- setFloating is floating-ui's callback ref for the positioned element, not a `.current` read
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-[60] w-80 overflow-hidden rounded-xl border border-border bg-white shadow-lg"
    >
      {/* Header: word + phonetic, "Seen before" badge, part-of-speech badge */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div>
          <div className="text-base font-bold text-foreground">{word}</div>
          {phonetic && (
            <div className="mt-0.5 font-mono text-[13px] text-text-secondary">
              {phonetic}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {hasPriors && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong bg-bg-secondary px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap text-text-secondary"
              title="Already in your word list"
            >
              <Bookmark size={10} /> Seen before
            </span>
          )}
          {lookup && (
            <span className="rounded bg-bg-tertiary px-2 py-0.5 text-[11px] font-medium text-text-secondary italic">
              {lookup.partOfSpeech}
            </span>
          )}
        </div>
      </div>

      {/* Body: mode === 'prior' branch (saved meanings) vs 'fresh' branch (LLM lookup) */}
      {mode === 'prior' && priors ? (
        confirmed ? (
          // --- prior / confirmed: "Fits here" was clicked, popup is about to auto-dismiss ---
          <div className="flex items-center justify-center gap-1.5 border-b border-border bg-accent-tint px-4 py-3.5 text-[13px] font-medium text-accent-dark">
            <Check size={14} /> Kept your earlier note
          </div>
        ) : (
          <>
            {/* prior / list: past meanings for this word */}
            <div className="border-b border-border px-4 py-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase">
                <Bookmark size={11} />
                {priors.length > 1 ? `You saved this ${priors.length} times` : 'You saved this before'}
              </div>
              <div className="flex max-h-[190px] flex-col gap-2 overflow-y-auto">
                {priors.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-r-lg border border-l-2 border-border border-l-border-strong bg-bg-secondary px-2.5 py-2"
                  >
                    <div className="mb-0.5 text-[13px] font-medium text-foreground">
                      {p.meaning}
                    </div>
                    <div className="line-clamp-2 font-serif text-[12px] leading-snug text-text-secondary italic">
                      &ldquo;{p.contextSentence}&rdquo;
                    </div>
                    <div className="mt-1 text-[11px] text-text-tertiary">
                      {formatRelativeTime(p.createdAt)}
                      {p.documentTitle ? ` · ${p.documentTitle}` : ''}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 text-[12px] text-text-secondary">
                {priors.length > 1
                  ? 'Does one of these fit this sentence?'
                  : 'Does this fit the sentence you’re reading?'}
              </div>
            </div>
            
            {/* prior / actions: confirm the saved meaning, or switch to a fresh lookup */}
            <div className="flex gap-2 bg-bg-secondary px-3 py-2.5">
              <button
                type="button"
                onClick={confirmFits}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-dark"
              >
                <Check size={14} /> Fits here
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('fresh');
                  ensureLookup();
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-bg-tertiary"
              >
                <Sparkles size={14} /> Look up again
              </button>
            </div>
          </>
        )
      ) : (
        <>
          {/* fresh / content: loading skeleton, error, or the LLM's meaning + explanation */}
          <div className="border-b border-border px-4 py-3 text-[13px] leading-normal">
            {loading || priors === null ? (
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

          {/* fresh / actions: save (word / new entry, depending on hasPriors) or dismiss */}
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
                  <BookmarkPlus size={14} />{' '}
                  {saving ? 'Saving…' : hasPriors ? 'Save as new entry' : 'Save word'}
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
        </>
      )}
    </div>
  );
}
