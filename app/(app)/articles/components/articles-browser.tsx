"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { ArticleCard } from "../../components/article-card";
import type { Article } from "../../lib/type";

const ARTICLE_FILTERS = [
  "All",
  "Continue reading",
  "Completed",
  "Saved",
] as const;
type ArticleFilter = (typeof ARTICLE_FILTERS)[number];


export function LibraryBrowser({ articles }: { articles: Article[] }) {
  const [filter, setFilter] = useState<ArticleFilter>("All");
  const [query, setQuery] = useState("");

  const filtered = articles.filter((a) => {
    if (query && !a.title.toLowerCase().includes(query.toLowerCase())) {
      return false;
    }
    if (filter !== "All") return false;
    return true;
  });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Your articles</h1>
          <div className="text-sm text-text-secondary">
            Everything you&apos;ve read, saved, or are still working through.
          </div>
        </div>
        <div className="flex min-w-60 items-center gap-2.5 rounded-[10px] border border-border bg-white px-3 py-2">
          <Search size={16} className="text-text-tertiary" />
          <input
            className="flex-1 border-none bg-transparent p-0 text-sm outline-none placeholder:text-text-tertiary"
            placeholder="Search your articles…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-6 flex gap-1.5">
        {ARTICLE_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-100 ${
              filter === f
                ? "border-accent bg-accent-tint text-accent-dark"
                : "border-border bg-white text-text-secondary hover:bg-bg-tertiary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-[60px] text-center text-text-tertiary">
          No articles match here yet.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </>
  );
}
