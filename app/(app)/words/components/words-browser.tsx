"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Download, ArrowRight, Brain, Trash2 } from "lucide-react";
import type { WordEntry, WordStatus } from "../../lib/types";
import { deleteWordAction } from "../../actions/words";

const FILTERS = ["all", "due", "mastered"] as const;
type Filter = (typeof FILTERS)[number];
const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  due: "Due today",
  mastered: "Mastered",
};

type Sort = "date" | "next" | "abc";

const STATUS_COLOR: Record<WordStatus, string> = {
  overdue: "text-danger",
  due: "text-accent-dark",
  scheduled: "text-text-secondary",
  mastered: "text-success",
};

export function WordsBrowser({ words }: { words: WordEntry[] }) {
  const [list, setList] = useState(words);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("date");

  const total = list.length;
  const mastered = list.filter((w) => w.status === "mastered").length;
  const due = list.filter((w) => w.status === "due" || w.status === "overdue").length;

  const filtered = useMemo(() => {
    let result = list.filter((w) => {
      if (
        query &&
        !w.word.toLowerCase().includes(query.toLowerCase()) &&
        !w.meaning.toLowerCase().includes(query.toLowerCase())
      ) {
        return false;
      }
      if (filter === "due") return w.status === "due" || w.status === "overdue";
      if (filter === "mastered") return w.status === "mastered";
      return true;
    });

    result = [...result].sort((a, b) => {
      if (sort === "next") return a.nextReviewAt - b.nextReviewAt;
      if (sort === "abc") return a.word.localeCompare(b.word);
      return b.createdAt - a.createdAt;
    });

    return result;
  }, [list, filter, query, sort]);

  async function handleDelete(id: string) {
    const prev = list;
    setList((current) => current.filter((w) => w.id !== id));
    try {
      await deleteWordAction(id);
    } catch {
      setList(prev);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold">My Words</h1>
          <p className="text-sm text-text-secondary">
            <strong className="text-foreground">{total}</strong> saved
            <span className="mx-2">·</span>
            <strong className="text-foreground">{mastered}</strong> mastered
            <span className="mx-2">·</span>
            <strong className="text-accent-dark">{due}</strong> due today
          </p>
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            disabled
            title="CSV/Anki export is planned but not built yet"
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border-strong px-3.5 py-2 text-[13px] font-medium text-text-tertiary opacity-60"
          >
            <Download size={14} /> Export CSV
          </button>
          <Link
            href="/review"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-accent-dark"
          >
            Start today&apos;s review <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-60 max-w-80 flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-tertiary"
          />
          <input
            className="w-full rounded-[10px] border border-border bg-white py-2 pr-3 pl-9 text-sm outline-none placeholder:text-text-tertiary"
            placeholder="Search words…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="date">Sort: Date saved</option>
          <option value="next">Sort: Next review</option>
          <option value="abc">Sort: Alphabetical</option>
        </select>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] font-medium transition-all duration-100 ${
              filter === f
                ? "border-accent bg-accent text-white"
                : "border-border bg-white text-text-secondary hover:border-border-strong hover:text-foreground"
            }`}
          >
            {FILTER_LABELS[f]}
            <span
              className={`rounded-full px-1.5 text-[11px] font-semibold ${
                filter === f ? "bg-white/20" : "bg-bg-tertiary"
              }`}
            >
              {f === "all" ? total : f === "due" ? due : mastered}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="grid grid-cols-[1.6fr_2.2fr_1.6fr_130px_90px] gap-4 border-b border-border bg-bg-secondary px-5 py-3 text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase">
          <div>Word</div>
          <div>Meaning</div>
          <div>Source article</div>
          <div>Next review</div>
          <div />
        </div>
        {filtered.map((w) => (
          <WordRow key={w.id} word={w} onDelete={handleDelete} />
        ))}
        {filtered.length === 0 && (
          <div className="px-5 py-[60px] text-center text-text-secondary">
            No words match your filters.
          </div>
        )}
      </div>
    </>
  );
}

function WordRow({
  word,
  onDelete,
}: {
  word: WordEntry;
  onDelete: (id: string) => void;
}) {
  const isDue = word.status === "due" || word.status === "overdue";
  return (
    <div
      className={`group grid grid-cols-[1.6fr_2.2fr_1.6fr_130px_90px] items-center gap-4 border-b border-border py-3.5 pr-5 pl-[17px] text-sm transition-colors hover:bg-bg-tertiary ${
        isDue ? "border-l-[3px] border-l-accent" : "border-l-[3px] border-l-transparent"
      }`}
    >
      <div>
        <div className="font-semibold text-foreground">{word.word}</div>
        {word.phonetic && (
          <div className="font-ipa text-[11px] text-text-tertiary">{word.phonetic}</div>
        )}
      </div>
      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-text-secondary">
        {word.meaning}
      </div>
      <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-text-secondary">
        {word.documentId ? (
          <Link href={`/read/${word.documentId}`} className="hover:text-accent-dark hover:underline">
            {word.documentTitle}
          </Link>
        ) : (
          (word.documentTitle ?? "—")
        )}
      </div>
      <div
        className={`text-[13px] ${STATUS_COLOR[word.status]} ${isDue ? "font-semibold" : ""}`}
      >
        {word.reviewLabel}
      </div>
      <div className="flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Link
          href="/review"
          title="Review"
          className="inline-flex items-center justify-center rounded-md border border-border-strong px-2.5 py-1 text-text-secondary hover:bg-bg-secondary"
        >
          <Brain size={12} />
        </Link>
        <button
          type="button"
          title="Delete"
          onClick={() => onDelete(word.id)}
          className="inline-flex items-center justify-center rounded-md border border-border-strong px-2.5 py-1 text-danger hover:bg-bg-secondary"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
