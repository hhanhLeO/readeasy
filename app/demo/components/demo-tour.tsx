"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bookmark, BookmarkPlus, Check, X } from "lucide-react";
import { Logo } from "@/app/components/logo";
import { CEFRBadge } from "@/app/(app)/components/cefr-badge";

type StepKey = "read" | "tap" | "save" | "review";

const DEMO_STEPS: { key: StepKey; title: string; desc: string }[] = [
  {
    key: "read",
    title: "Read real English news",
    desc: "Paste any article and read it at your level. Tap any word you don't know for help — no dictionary digging required.",
  },
  {
    key: "tap",
    title: "Tap a word for instant help",
    desc: "Click any word and ReadEasy explains it in Vietnamese — meaning, pronunciation, and how it's used right here in this sentence.",
  },
  {
    key: "save",
    title: "Save it to your word list",
    desc: "One click on Save keeps the word together with the sentence you found it in, so the meaning stays tied to real context.",
  },
  {
    key: "review",
    title: "Never forget what you learn",
    desc: "Saved words come back as flashcards exactly when you're about to forget them. Spaced repetition turns reading into real vocabulary.",
  },
];

const WORD = {
  word: "substantial",
  ipa: "/səbˈstænʃəl/",
  pos: "adj",
  vn: "đáng kể, lớn về quy mô",
  explain:
    'Trong câu này, "substantial" diễn tả mức độ lớn đáng chú ý của sự thay đổi — mạnh hơn "big" và trang trọng hơn.',
};

export function DemoTour() {
  const [step, setStep] = useState(0);
  const cur = DEMO_STEPS[step];
  const isLast = step === DEMO_STEPS.length - 1;

  const next = () => setStep((s) => Math.min(s + 1, DEMO_STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") back();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-bg-secondary">
      {/* Top bar */}
      <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-white px-8">
        <Logo />
        <div className="inline-flex items-center gap-2 text-[13px] font-medium text-text-secondary">
          <span className="inline-block h-[7px] w-[7px] animate-[demo-pulse_1.6s_infinite] rounded-full bg-accent" />
          Interactive demo
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-tint"
        >
          <X size={14} /> Close
        </Link>
      </div>

      {/* Narration rail + stage */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-[minmax(260px,300px)_1fr]">
        {/* Narration rail */}
        <div className="flex flex-col border-b border-border bg-white p-7 md:border-r md:border-b-0">
          <div className="mb-8 flex gap-1.5">
            {DEMO_STEPS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStep(i)}
                title={s.title}
                className="h-1 flex-1 rounded-full p-0 transition-colors duration-200"
                style={{ background: i <= step ? "var(--accent)" : "var(--bg-tertiary)" }}
              />
            ))}
          </div>

          <div className="flex-1" key={step}>
            <div className="mb-3.5 font-mono text-xs font-medium tracking-[0.04em] text-accent-dark">
              STEP {step + 1} / {DEMO_STEPS.length}
            </div>
            <h1 className="mb-4 text-balance font-serif text-[30px] leading-[1.2] font-bold tracking-[-0.01em]">
              {cur.title}
            </h1>
            <p className="text-pretty text-[15.5px] leading-[1.7] text-text-secondary">{cur.desc}</p>
          </div>

          <div className="mt-8">
            {isLast ? (
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={back}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-bg-tertiary"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <Link
                  href="/home"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3.5 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
                >
                  Start reading <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-bg-tertiary disabled:opacity-40"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3.5 py-2.5 text-sm font-medium text-white hover:bg-accent-dark"
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            )}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-tertiary">
              Use{" "}
              <span className="inline-block rounded border border-border bg-bg-tertiary px-1.5 py-px font-mono text-[11px]">
                ←
              </span>{" "}
              <span className="inline-block rounded border border-border bg-bg-tertiary px-1.5 py-px font-mono text-[11px]">
                →
              </span>{" "}
              to navigate
            </div>
          </div>
        </div>

        {/* Stage */}
        <div className="flex items-center justify-center overflow-hidden p-4 md:p-6">
          <DemoStage stepKey={cur.key} />
        </div>
      </div>
    </div>
  );
}

function DemoStage({ stepKey }: { stepKey: StepKey }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const [anchor, setAnchor] = useState({ left: 0, bottom: 0, width: 0, containerWidth: 0 });

  useLayoutEffect(() => {
    function measure() {
      const wordEl = wordRef.current;
      const bodyEl = bodyRef.current;
      if (!wordEl || !bodyEl) return;
      const wr = wordEl.getBoundingClientRect();
      const br = bodyEl.getBoundingClientRect();
      setAnchor({ left: wr.left - br.left, bottom: wr.bottom - br.top, width: wr.width, containerWidth: br.width });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [stepKey]);

  if (stepKey === "review") return <DemoFlashcard />;

  const showPopup = stepKey === "tap" || stepKey === "save";
  const showSave = stepKey === "save";
  const spotlightWord = stepKey === "read";

  const popupWidth = 320;
  const popupLeft = Math.min(
    Math.max(8, anchor.left + anchor.width / 2 - popupWidth / 2),
    Math.max(8, anchor.containerWidth - popupWidth - 8),
  );

  return (
    <div className="relative flex w-full max-w-[1100px] overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
      <div className="min-h-[440px] min-w-0 flex-1">
        {/* faux browser chrome */}
        <div className="flex h-[38px] items-center gap-1.5 border-b border-border bg-bg-secondary px-3.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FCA5A5]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FCD34D]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#86EFAC]" />
          <div className="ml-2.5 flex h-[22px] flex-1 items-center rounded-md border border-border bg-white px-2.5 font-mono text-[11px] text-text-tertiary">
            readeasy.ai/read
          </div>
        </div>

        {/* article body */}
        <div ref={bodyRef} className="relative min-h-[430px] px-8 pt-7 pb-8">
          <div className="mb-3 flex items-center gap-2 text-[13px] text-text-secondary">
            <strong className="text-foreground">World Press</strong>
            <CEFRBadge level="B1" />
            <span>·</span>
            <span>5 min read</span>
          </div>
          <h2 className="mb-[18px] text-balance font-serif text-[23px] leading-[1.3] font-bold tracking-[-0.01em]">
            How small cities are reshaping remote work
          </h2>

          <div className="text-[16.5px] leading-[1.8]">
            <p className="m-0">
              A growing number of remote workers are leaving expensive cities, drawn by lower rents and a{" "}
              <span
                ref={wordRef}
                className={
                  showPopup
                    ? "rounded-sm border-b-2 border-solid border-accent bg-accent-light"
                    : spotlightWord
                      ? "border-b-2 border-accent-light bg-accent-tint"
                      : "border-b-2 border-accent-light"
                }
              >
                substantial
              </span>{" "}
              improvement in quality of life. But as months passed, productivity stayed strong.
            </p>
            <p className="mt-4 mb-0">
              Towns that were once losing people are thriving again, and a new kind of commute — from bedroom to
              kitchen — has replaced the long drive into the city.
            </p>
          </div>

          {/* faux cursor for tap step */}
          {stepKey === "tap" && (
            <div
              className="absolute z-[5] animate-[demo-tap_1.4s_ease-in-out_infinite]"
              style={{ top: anchor.bottom - 4, left: anchor.left + anchor.width / 2 - 4 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="var(--text-primary)" stroke="white" strokeWidth="1.5">
                <path d="M5 3l5 16 2.5-6.5L19 10z" />
              </svg>
            </div>
          )}

          {/* inline popup for tap / save steps */}
          {showPopup && (
            <div
              className="absolute z-10 w-80 overflow-hidden rounded-xl border border-border bg-white shadow-lg"
              style={{ top: anchor.bottom + 22, left: popupLeft }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div>
                  <div className="text-base font-bold text-foreground">{WORD.word}</div>
                  <div className="mt-0.5 font-ipa text-[13px] text-text-secondary">{WORD.ipa}</div>
                </div>
                <span className="rounded bg-bg-tertiary px-2 py-0.5 text-[11px] font-medium text-text-secondary italic">
                  {WORD.pos}
                </span>
              </div>
              <div className="border-b border-border px-4 py-3 text-[13px] leading-normal">
                <div className="mb-2 font-medium text-foreground">{WORD.vn}</div>
                <div className="text-text-secondary">{WORD.explain}</div>
              </div>
              <div className="flex gap-2 bg-bg-secondary px-3 py-2.5">
                <button
                  type="button"
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium ${
                    showSave ? "border border-border-strong text-foreground" : "bg-accent text-white"
                  }`}
                >
                  {showSave ? (
                    <>
                      <Check size={14} /> Saved
                    </>
                  ) : (
                    <>
                      <BookmarkPlus size={14} /> Save word
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-[13px] font-medium text-foreground"
                >
                  <X size={14} /> Dismiss
                </button>
              </div>
              {showSave && (
                <div className="flex items-center gap-1.5 border-t border-border bg-accent-tint px-3.5 py-2.5 text-xs text-accent-dark">
                  <Bookmark size={13} /> Added to your word list with this sentence
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DemoFlashcard() {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 900);
    return () => clearTimeout(t);
  }, []);

  const card = {
    word: "substantial",
    ipa: "/səbˈstænʃəl/",
    vn: "đáng kể, lớn về quy mô",
    explain: 'Một mức độ lớn đáng chú ý — mạnh hơn "big" và trang trọng hơn.',
    example: "The project required substantial investment.",
  };

  const RATINGS = [
    { emoji: "😰", label: "Không nhớ" },
    { emoji: "😕", label: "Khó nhớ" },
    { emoji: "🙂", label: "Nhớ được" },
    { emoji: "😄", label: "Nhớ rõ" },
  ];

  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-4 text-center text-[13px] text-text-secondary">
        Due today · 1 of 12 &nbsp;·&nbsp;{" "}
        <span className="font-semibold text-accent-dark">🔥 Day 8 streak</span>
      </div>
      <div style={{ perspective: 1600 }}>
        <div
          className="relative min-h-[320px] w-full transition-transform duration-[400ms] [transform-style:preserve-3d]"
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
            <div className="mt-2 mb-1 font-serif text-[34px] font-bold tracking-[-0.01em]">{card.word}</div>
            <div className="mb-6 font-mono text-base text-text-secondary">{card.ipa}</div>
            <div className="border-t border-b border-border py-4 font-serif text-[15px] leading-[1.7] text-text-secondary italic">
              …drawn by lower rents and a{" "}
              <span className="rounded bg-accent-light px-1 font-semibold not-italic text-accent-dark">
                substantial
              </span>{" "}
              improvement in quality of life.
            </div>
            <div className="mt-auto pt-4 text-xs text-text-tertiary">
              From: World Press · How small cities are reshaping…
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col rounded-2xl border border-border bg-white p-8 shadow-md [backface-visibility:hidden]"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="flex items-baseline gap-2.5">
              <div className="font-serif text-[22px] font-bold">{card.word}</div>
              <div className="font-mono text-[13px] text-text-secondary">{card.ipa}</div>
            </div>
            <div className="mt-3 mb-2 font-serif text-[21px] font-semibold">{card.vn}</div>
            <div className="text-sm leading-[1.6] text-text-secondary">{card.explain}</div>
            <div className="mt-auto border-t border-border pt-3.5 font-serif text-sm text-foreground italic">
              {card.example}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-4 gap-2.5">
        {RATINGS.map((r) => (
          <div
            key={r.label}
            className="flex flex-col items-center gap-1 rounded-[10px] border border-border bg-white py-3.5 text-xs font-medium text-text-secondary"
          >
            <span className="text-xl leading-none">{r.emoji}</span>
            <span>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
