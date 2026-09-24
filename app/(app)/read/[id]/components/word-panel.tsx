"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Bookmark,
  Check,
  Save,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import {
  saveWordAction,
  getSavedMeaningsAction,
  type SavedMeaning,
} from "@/app/(app)/actions/words";
import { formatRelativeTime } from "@/app/(app)/lib/format";
import type { WordLookup } from "@/app/lib/llm/lookup";
import type { DictionaryResult } from "@/app/lib/dictionary/lookup";
import type { DictionaryPos } from "@/app/lib/db/schema";

const GENERIC_LOOKUP_ERROR = "Couldn't look up this word. Try again.";
// Long ovdp entries can have 20-30 senses; the rest sit behind "Show more".
const INITIAL_SENSES = 6;

const POS_LABELS: Record<DictionaryPos, string> = {
  n: "noun",
  v: "verb",
  adj: "adj",
  adv: "adv",
  prep: "prep",
  conj: "conj",
  pron: "pron",
  det: "det",
  interj: "interj",
  abbr: "abbr",
  other: "other",
};

type Sense = {
  headword: string;
  ipa: string | null;
  pos: DictionaryPos;
  vi: string;
  en?: string;
  example?: string;
};

function flattenSenses(results: DictionaryResult[]): Sense[] {
  return results.flatMap((r) =>
    r.entries.flatMap((group) =>
      group.senses.map((s) => ({
        headword: r.headword,
        ipa: r.ipa,
        pos: group.pos,
        vi: s.vi,
        en: s.en,
        example: s.examples?.[0]?.en,
      })),
    ),
  );
}

type AiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; lookup: WordLookup }
  | { status: "error"; message: string; quota: boolean };

const BTN =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-all duration-150 disabled:cursor-not-allowed";
const BTN_PRIMARY = `${BTN} bg-accent text-white hover:bg-accent-dark disabled:bg-bg-tertiary disabled:text-text-tertiary`;
const BTN_SECONDARY = `${BTN} border border-border-strong text-foreground hover:bg-bg-tertiary`;
const SECTION_LABEL =
  "text-[11px] font-semibold tracking-[0.08em] text-text-tertiary uppercase";
const POS_BADGE =
  "inline-flex items-center rounded bg-bg-tertiary font-medium tracking-[0.02em] text-foreground italic";

function Skeleton({ className }: { className: string }) {
  return (
    <div className={`animate-pulse rounded bg-bg-tertiary ${className}`} />
  );
}

export function WordPanel({
  selectionId,
  ...props
}: {
  selectionId: number;
  word: string;
  sentence: string;
  documentId: string;
  onClose: () => void;
  onSaved: (word: string) => void;
}) {
  return (
    <aside
      data-word-panel
      aria-label={`Lookup: ${props.word}`}
      className="fixed top-14 right-0 bottom-0 z-40 flex w-[360px] animate-[slide-in-right_300ms_ease-out] flex-col overflow-hidden border-l border-border bg-bg-secondary"
    >
      <WordPanelContent key={selectionId} {...props} />
    </aside>
  );
}

function WordPanelContent({
  word,
  sentence,
  documentId,
  onClose,
  onSaved,
}: {
  word: string;
  sentence: string;
  documentId: string;
  onClose: () => void;
  onSaved: (word: string) => void;
}) {
  const [priors, setPriors] = useState<SavedMeaning[] | null>(null);
  const [showPriors, setShowPriors] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [dict, setDict] = useState<DictionaryResult[] | null>(null);
  const [dictError, setDictError] = useState(false);
  const [picked, setPicked] = useState(0);
  const [showAllSenses, setShowAllSenses] = useState(false);

  const [tab, setTab] = useState<"dict" | "ai">("dict");
  const [ai, setAi] = useState<AiState>({ status: "idle" });
  const aiRequested = useRef(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Priors and the dictionary are both free (DB reads), so they're fetched
  // together up front; only the AI lookup waits for an explicit request.
  useEffect(() => {
    let cancelled = false;

    getSavedMeaningsAction(word).then((data) => {
      if (cancelled) return;
      setPriors(data);
      setShowPriors(data.length > 0);
    });

    fetch(`/api/dictionary?word=${encodeURIComponent(word)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { results: DictionaryResult[] }) => {
        if (!cancelled) setDict(data.results);
      })
      .catch(() => {
        if (!cancelled) setDictError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [word]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // The LLM costs money per call, so it runs only when the reader opens the
  // AI tab, and at most once per word — switching tabs back and forth reuses
  // the first result. A failed call can be retried from its error state.
  function askAi() {
    setTab("ai");
    if (aiRequested.current) return;
    aiRequested.current = true;
    setAi({ status: "loading" });

    fetch("/api/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, sentence }),
    })
      .then(async (res) => {
        if (res.ok) {
          setAi({ status: "done", lookup: (await res.json()) as WordLookup });
          return;
        }
        const body = await res.json().catch(() => null);
        setAi({
          status: "error",
          message:
            typeof body?.error === "string" ? body.error : GENERIC_LOOKUP_ERROR,
          quota: res.status === 429,
        });
        aiRequested.current = false;
      })
      .catch(() => {
        setAi({ status: "error", message: GENERIC_LOOKUP_ERROR, quota: false });
        aiRequested.current = false;
      });
  }

  const senses = dict ? flattenSenses(dict) : [];
  const headwords = dict ? dict.map((r) => r.headword) : [];
  const visibleSenses = showAllSenses
    ? senses
    : senses.slice(0, INITIAL_SENSES);
  const pickedSense = senses[picked];

  // What the save button would store right now, depending on the tab.
  const toSave =
    tab === "ai"
      ? ai.status === "done"
        ? { word, meaning: ai.lookup.meaning, phonetic: ai.lookup.phonetic }
        : null
      : pickedSense
        ? // Dictionary saves store the headword ("go" for "went"), so every
          // inflection of a word shares one vocab entry and review card.
          {
            word: pickedSense.headword,
            meaning: pickedSense.vi,
            phonetic: pickedSense.ipa ?? undefined,
          }
        : null;

  async function handleSave() {
    if (!toSave || saving || saved) return;
    setSaving(true);
    try {
      await saveWordAction({
        documentId,
        contextSentence: sentence,
        ...toSave,
      });
      setSaved(true);
      onSaved(toSave.word);
    } finally {
      setSaving(false);
    }
  }

  function confirmFits() {
    setConfirmed(true);
    setTimeout(onClose, 900);
  }

  const hasPriors = !!priors && priors.length > 0;
  const ipa =
    (tab === "ai" && ai.status === "done" ? ai.lookup.phonetic : null) ||
    pickedSense?.ipa ||
    dict?.[0]?.ipa ||
    priors?.[0]?.phonetic;
  // "leaves → leaf, leave": shown when the clicked word isn't itself the
  // (only) headword it resolved to.
  const showHeadwords =
    headwords.length > 1 ||
    (headwords.length === 1 && headwords[0] !== word.toLowerCase());

  const saveLabel =
    tab === "dict" && senses.length > 1
      ? `Save meaning ${picked + 1}`
      : tab === "ai"
        ? "Save AI meaning"
        : "Save word";

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {/* Header: word, the headword(s) it resolved to, IPA, "Seen before" */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <div className="font-serif text-[26px] leading-[1.2] font-bold tracking-[-0.01em] text-foreground">
              {word}
            </div>
            {showHeadwords && (
              <div className="mt-1 text-[13px] text-text-secondary">
                → {headwords.join(", ")}
              </div>
            )}
            {ipa && (
              <div className="mt-1 mb-3 font-ipa text-sm text-text-secondary">
                {ipa}
              </div>
            )}
            {hasPriors && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong bg-bg-secondary px-[7px] py-0.5 text-[10.5px] font-semibold tracking-[0.02em] whitespace-nowrap text-text-secondary"
                  title="Already in your word list"
                >
                  <Bookmark size={11} /> Seen before
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="grid h-7 w-7 shrink-0 cursor-pointer place-items-center rounded-md border border-border bg-white text-text-secondary"
          >
            <X size={14} />
          </button>
        </div>

        {/* In this article: the context sentence, clicked word highlighted */}
        <div className="mt-4 mb-5">
          <div className={`mb-2 ${SECTION_LABEL}`}>In this article</div>
          <div className="rounded-lg border-l-[3px] border-accent bg-white px-3.5 py-3 font-serif text-[15px] leading-[1.6] text-foreground italic">
            <HighlightedSentence sentence={sentence} word={word} />
          </div>
        </div>

        {priors === null ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ) : showPriors ? (
          // --- earlier saves of this word: confirm one fits, or look up again ---
          <div className="mb-5">
            <div className="mb-2 flex items-center gap-[5px] text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase">
              <Bookmark size={11} />
              {priors.length > 1
                ? `You saved this ${priors.length} times`
                : "You saved this before"}
            </div>
            <div className="flex flex-col gap-2">
              {priors.map((p, i) => (
                <div
                  key={i}
                  className="rounded-r-lg border border-l-2 border-border border-l-border-strong bg-bg-secondary px-2.5 py-2"
                >
                  <div className="mb-[3px] text-[13px] font-medium text-foreground">
                    {p.meaning}
                  </div>
                  <div className="line-clamp-2 font-serif text-[12px] leading-[1.45] text-text-secondary italic">
                    &ldquo;{p.contextSentence}&rdquo;
                  </div>
                  <div className="mt-1 text-[11px] text-text-tertiary">
                    {formatRelativeTime(p.createdAt)}
                    {p.documentTitle ? ` · ${p.documentTitle}` : ""}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2.5 text-[12px] text-text-secondary">
              {priors.length > 1
                ? "Does one of these fit this sentence?"
                : "Does this fit the sentence you’re reading?"}
            </div>
          </div>
        ) : (
          <>
            {/* Tabs: dictionary (default, free) vs AI (on request, uses quota) */}
            <div
              role="tablist"
              className="mb-4 flex gap-1 rounded-[10px] border border-border bg-white p-[3px]"
            >
              <TabButton active={tab === "dict"} onClick={() => setTab("dict")}>
                <BookOpen size={13} /> Dictionary
                {dict && dict.length > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-px font-mono text-[10.5px] ${
                      tab === "dict"
                        ? "bg-white text-accent-dark"
                        : "bg-bg-secondary text-text-secondary"
                    }`}
                  >
                    {senses.length}
                  </span>
                )}
              </TabButton>
              <TabButton active={tab === "ai"} onClick={askAi}>
                <Sparkles size={13} /> Ask AI
              </TabButton>
            </div>

            {tab === "dict" && (
              <div className="mb-5">
                {dict === null && !dictError ? (
                  <div className="space-y-2">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                ) : dictError || senses.length === 0 ? (
                  // --- not found (or the lookup failed): AI is the way forward ---
                  <>
                    <div className="mb-2 text-sm font-semibold text-foreground">
                      {dictError
                        ? GENERIC_LOOKUP_ERROR
                        : "Not in the dictionary"}
                    </div>
                    <div className="text-sm leading-[1.6] text-text-secondary">
                      {dictError
                        ? "You can still ask AI what it means in this sentence."
                        : `We couldn’t find “${word}” in the dictionary. AI can explain what it means in this sentence.`}
                    </div>
                    <button
                      type="button"
                      onClick={askAi}
                      className={`${BTN_PRIMARY} mt-4 w-full px-5 py-2.5 text-sm`}
                    >
                      <Sparkles size={14} /> Ask AI
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={SECTION_LABEL}>
                        {senses.length}{" "}
                        {senses.length > 1 ? "meanings" : "meaning"}
                      </span>
                      {senses.length > 1 && (
                        <span className="text-[11.5px] text-text-tertiary">
                          Pick the one that fits
                        </span>
                      )}
                    </div>
                    <div role="radiogroup" className="flex flex-col gap-1.5">
                      {visibleSenses.map((s, i) => (
                        <SenseItem
                          key={i}
                          index={i}
                          sense={s}
                          selected={picked === i}
                          showHeadword={headwords.length > 1}
                          onSelect={() => setPicked(i)}
                        />
                      ))}
                    </div>
                    {!showAllSenses && senses.length > INITIAL_SENSES && (
                      <button
                        type="button"
                        onClick={() => setShowAllSenses(true)}
                        className="mt-2 cursor-pointer border-none bg-transparent p-0 text-[12px] font-medium text-accent-dark hover:underline"
                      >
                        Show {senses.length - INITIAL_SENSES} more
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={askAi}
                      className="mt-3 flex w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border-strong bg-transparent px-3 py-2.5 text-left text-[13px] font-medium text-accent-dark hover:border-accent hover:bg-accent-tint"
                    >
                      <Sparkles size={14} />
                      <span>
                        None fit? Ask AI what it means in this sentence
                      </span>
                    </button>
                  </>
                )}
              </div>
            )}

            {tab === "ai" && (
              <div className="mb-5">
                {ai.status === "loading" || ai.status === "idle" ? (
                  <>
                    <Skeleton className="mb-2.5 h-[18px] w-[65%]" />
                    <Skeleton className="mb-1.5 h-[13px] w-[95%]" />
                    <Skeleton className="mb-1.5 h-[13px] w-[90%]" />
                    <Skeleton className="h-[13px] w-[60%]" />
                  </>
                ) : ai.status === "error" ? (
                  // --- quota reached, or the call failed ---
                  <>
                    <div className="mb-2 text-sm font-semibold text-foreground">
                      {ai.quota
                        ? "No AI lookups left today"
                        : GENERIC_LOOKUP_ERROR}
                    </div>
                    <div className="text-sm leading-[1.6] text-text-secondary">
                      {ai.quota
                        ? "Your AI lookups reset at midnight. The dictionary is always free."
                        : ai.message}
                    </div>
                    <div className="mt-4 flex gap-2">
                      {!ai.quota && (
                        <button
                          type="button"
                          onClick={askAi}
                          className={`${BTN_PRIMARY} flex-1 px-5 py-2.5 text-sm`}
                        >
                          Try again
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setTab("dict")}
                        className={`${BTN_SECONDARY} flex-1 px-5 py-2.5 text-sm`}
                      >
                        <BookOpen size={14} /> Back to dictionary
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={SECTION_LABEL}>Meaning here</span>
                      <span className={`${POS_BADGE} px-2 py-0.5 text-[11px]`}>
                        {ai.lookup.partOfSpeech}
                      </span>
                    </div>
                    <div className="mb-1.5 text-lg leading-[1.4] font-semibold text-foreground">
                      {ai.lookup.meaning}
                    </div>
                    <div className="text-sm leading-[1.6] text-text-secondary">
                      {ai.lookup.explanation}
                    </div>
                    <div className="mt-4 text-[11.5px] text-text-tertiary">
                      Generated by AI for this sentence. Check it against the
                      dictionary.
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer: confirm/look-up-again for priors, otherwise save */}
      <div className="shrink-0 border-t border-border bg-bg-secondary px-6 pt-3.5 pb-[18px]">
        {showPriors ? (
          confirmed ? (
            <div className="flex items-center justify-center gap-1.5 bg-accent-tint p-2.5 text-[13px] font-medium text-accent-dark">
              <Check size={14} /> Kept your earlier note
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmFits}
                className={`${BTN_PRIMARY} flex-1 px-5 py-2.5 text-sm`}
              >
                <Check size={15} /> Fits here
              </button>
              <button
                type="button"
                onClick={() => setShowPriors(false)}
                className={`${BTN_SECONDARY} flex-1 px-5 py-2.5 text-sm`}
              >
                <Search size={15} /> Look up again
              </button>
            </div>
          )
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saved || saving || !toSave}
            className={`${saved ? BTN_SECONDARY : BTN_PRIMARY} w-full px-7 py-3.5 text-[15px]`}
          >
            {saved ? (
              <>
                <Check size={16} /> Saved to your words
              </>
            ) : (
              <>
                <Save size={16} /> {saving ? "Saving…" : saveLabel}
              </>
            )}
          </button>
        )}
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex h-[34px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[7px] border-none text-[13px] font-medium ${
        active
          ? "bg-accent-tint text-accent-dark"
          : "bg-transparent text-text-secondary hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function SenseItem({
  index,
  sense,
  selected,
  showHeadword,
  onSelect,
}: {
  index: number;
  sense: Sense;
  selected: boolean;
  showHeadword: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors duration-100 ${
        selected
          ? "border-accent bg-accent-tint"
          : "border-border bg-white hover:border-border-strong"
      }`}
    >
      <span
        className={`mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full font-mono text-[10.5px] ${
          selected
            ? "bg-accent text-white"
            : "bg-bg-secondary text-text-secondary"
        }`}
      >
        {index + 1}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-sm font-semibold text-foreground">
            {sense.vi}
          </span>
          <span
            className={`${POS_BADGE} px-[7px] py-px text-[11px] leading-normal ${selected ? "bg-white" : ""}`}
          >
            {showHeadword ? `${sense.headword} · ` : ""}
            {POS_LABELS[sense.pos]}
          </span>
        </span>
        {sense.en && (
          <span className="text-[12.5px] leading-[1.45] text-text-secondary">
            {sense.en}
          </span>
        )}
        {sense.example && (
          <span className="font-serif text-[13px] text-text-secondary italic">
            {sense.example}
          </span>
        )}
      </span>
    </button>
  );
}

function HighlightedSentence({
  sentence,
  word,
}: {
  sentence: string;
  word: string;
}) {
  const index = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (index === -1) return <>{sentence}</>;
  return (
    <>
      {sentence.slice(0, index)}
      <span className="rounded-[3px] bg-accent-light px-[3px] font-semibold text-accent-dark not-italic">
        {sentence.slice(index, index + word.length)}
      </span>
      {sentence.slice(index + word.length)}
    </>
  );
}
