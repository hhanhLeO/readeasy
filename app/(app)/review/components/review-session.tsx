"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import type { ReviewCard } from "../../lib/types";
import { submitReviewAction } from "../../actions/reviews";
import type { Rating } from "../../lib/srs";

const RATINGS: { id: Rating; emoji: string; label: string; className: string }[] = [
  { id: 1, emoji: "😰", label: "Again", className: "hover:border-danger hover:bg-[#FEF2F2] hover:text-danger" },
  { id: 2, emoji: "😕", label: "Hard", className: "hover:border-warning hover:bg-[#FFFBEB] hover:text-warning" },
  { id: 3, emoji: "🙂", label: "Good", className: "hover:border-[#93C5FD] hover:bg-[#EFF6FF] hover:text-[#3B82F6]" },
  { id: 4, emoji: "😄", label: "Easy", className: "hover:border-success hover:bg-[#ECFDF5] hover:text-success" },
];

function highlightWord(sentence: string, word: string) {
  const re = new RegExp(`(\\b${word}\\b)`, "i");
  const parts = sentence.split(re);
  return parts.map((part, i) =>
    re.test(part) ? (
      <span key={i} className="rounded bg-accent-light px-1 font-semibold not-italic text-accent-dark">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function ReviewSession({ cards }: { cards: ReviewCard[] }) {
  const [stage, setStage] = useState<"start" | "card" | "done">("start");
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Rating[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (cards.length === 0) {
    return (
      <div className="mx-auto max-w-[480px] rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
        <div className="mb-3 text-5xl">🎉</div>
        <h1 className="mb-2 font-serif text-2xl font-bold">All caught up</h1>
        <p className="mb-6 text-text-secondary">No words due for review right now.</p>
        <Link
          href="/words"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
        >
          View my words
        </Link>
      </div>
    );
  }

  async function rate(rating: Rating) {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitReviewAction(cards[idx].reviewId, rating);
      setResults((prev) => [...prev, rating]);
      if (idx + 1 < cards.length) {
        setIdx(idx + 1);
        setFlipped(false);
      } else {
        setStage("done");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/words"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-[13px] font-medium text-text-secondary hover:bg-bg-tertiary"
        >
          <X size={14} /> Exit
        </Link>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-tertiary">
          {stage === "card" && (
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${((idx + (flipped ? 0.5 : 0)) / cards.length) * 100}%` }}
            />
          )}
        </div>
        <div className="min-w-14 text-right text-[13px] font-medium text-text-secondary">
          {stage === "card" && `${idx + 1} / ${cards.length}`}
        </div>
      </div>

      {stage === "start" && (
        <div className="mx-auto max-w-[480px] rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
          <div className="mb-3 text-5xl">🧠</div>
          <h1 className="mb-2 font-serif text-2xl font-bold">Daily Review</h1>
          <p className="mb-7 text-text-secondary">
            {cards.length} {cards.length === 1 ? "word" : "words"} due today
          </p>
          <button
            type="button"
            onClick={() => setStage("card")}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
          >
            Start session <ArrowRight size={14} />
          </button>
        </div>
      )}

      {stage === "card" && (
        <div className="flex flex-col items-center" key={idx}>
          <div className="w-full max-w-[560px]" style={{ perspective: 1600 }}>
            <div
              className="relative min-h-[380px] w-full transition-transform duration-[400ms] [transform-style:preserve-3d]"
              style={{
                transform: flipped ? "rotateY(180deg)" : undefined,
                transitionTimingFunction: "cubic-bezier(0.5,0,0.5,1)",
              }}
            >
              {/* Front */}
              <div className="absolute inset-0 flex flex-col rounded-2xl border border-border bg-white p-8 shadow-md [backface-visibility:hidden]">
                <div className="text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase">
                  What does this word mean?
                </div>
                <div className="mt-2 mb-1 font-serif text-4xl font-bold tracking-tight">
                  {cards[idx].word}
                </div>
                {cards[idx].phonetic && (
                  <div className="mb-6 font-ipa text-base text-text-secondary">
                    {cards[idx].phonetic}
                  </div>
                )}
                <div className="border-t border-b border-border py-4 font-serif text-base leading-relaxed text-text-secondary italic">
                  {highlightWord(cards[idx].contextSentence, cards[idx].word)}
                </div>
                {cards[idx].documentTitle && (
                  <div className="mt-auto pt-4 text-xs text-text-tertiary">
                    From: {cards[idx].documentTitle}
                  </div>
                )}
                {!flipped && (
                  <button
                    type="button"
                    onClick={() => setFlipped(true)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
                  >
                    Show meaning <ArrowRight size={14} />
                  </button>
                )}
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 flex flex-col rounded-2xl border border-border bg-white p-8 shadow-md [backface-visibility:hidden]"
                style={{ transform: "rotateY(180deg)" }}
              >
                <div className="flex items-baseline gap-2.5">
                  <div className="font-serif text-[22px] font-bold">{cards[idx].word}</div>
                  {cards[idx].phonetic && (
                    <div className="font-ipa text-[13px] text-text-secondary">
                      {cards[idx].phonetic}
                    </div>
                  )}
                </div>
                <div className="mt-3 mb-4 font-serif text-[22px] font-semibold">
                  {cards[idx].meaning}
                </div>
                <div className="border-t border-border pt-3.5">
                  <div className="mb-1.5 text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase">
                    In your article
                  </div>
                  <div className="font-serif text-sm leading-relaxed text-text-secondary italic">
                    {highlightWord(cards[idx].contextSentence, cards[idx].word)}
                  </div>
                </div>
                {cards[idx].documentTitle && (
                  <div className="mt-auto pt-4 text-xs text-text-tertiary">
                    From: {cards[idx].documentTitle}
                  </div>
                )}
              </div>
            </div>
          </div>

          {flipped && (
            <div className="mt-4 grid w-full max-w-[560px] grid-cols-4 gap-2.5">
              {RATINGS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={submitting}
                  onClick={() => rate(r.id)}
                  className={`flex flex-col items-center gap-1 rounded-[10px] border border-border bg-white py-3.5 text-[12px] font-medium text-text-secondary transition-all duration-100 hover:-translate-y-0.5 disabled:opacity-60 ${r.className}`}
                >
                  <span className="text-xl leading-none">{r.emoji}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {stage === "done" && <ReviewComplete results={results} />}
    </>
  );
}

function ReviewComplete({ results }: { results: Rating[] }) {
  const buckets = RATINGS.map((r) => results.filter((x) => x === r.id).length);

  return (
    <div className="mx-auto max-w-[520px] rounded-2xl border border-border bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-accent-tint text-accent-dark">
        <Check size={40} />
      </div>
      <h1 className="mb-2 font-serif text-2xl font-bold">Session complete!</h1>
      <p className="mb-7 text-text-secondary">
        Great work — you reviewed {results.length} {results.length === 1 ? "word" : "words"} today.
      </p>

      <div className="mb-5 rounded-xl border border-border bg-bg-secondary p-4">
        {RATINGS.map((r, i) => (
          <div
            key={r.id}
            className={`flex items-center gap-3 py-2 ${i < RATINGS.length - 1 ? "border-b border-border" : ""}`}
          >
            <span className="text-xl">{r.emoji}</span>
            <span className="flex-1 text-left text-sm text-text-secondary">{r.label}</span>
            <span className="font-semibold text-foreground">
              {buckets[i]} {buckets[i] === 1 ? "word" : "words"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-2.5">
        <Link
          href="/words"
          className="inline-flex flex-1 items-center justify-center rounded-lg border border-border-strong px-4 py-2.5 text-sm font-medium text-foreground hover:bg-bg-tertiary"
        >
          View my words
        </Link>
        <Link
          href="/articles"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
        >
          Read an article <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
