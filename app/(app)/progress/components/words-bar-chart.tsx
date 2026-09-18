"use client";

import { useState } from "react";
import type { WeeklyWordCount } from "../lib/stats";

export function WordsBarChart({ data }: { data: WeeklyWordCount[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const maxWords = Math.max(1, ...data.map((d) => d.words));

  return (
    <div className="p-5 pb-7">
      <div className="relative mb-2 flex h-[180px] items-end gap-3.5">
        {data.map((d, i) => {
          const heightPct = (d.words / maxWords) * 100;
          const isHover = hover === i;
          return (
            <div
              key={d.label}
              className="relative flex flex-1 flex-col items-center gap-1.5"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {isHover && (
                <div className="absolute bottom-full z-10 mb-2 rounded-md bg-foreground px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-md">
                  Week of {d.label}: <strong>{d.words}</strong> words
                </div>
              )}
              <div
                style={{ height: `${heightPct}%` }}
                className={`min-h-1 w-full rounded-t-md transition-all duration-200 ${
                  d.current
                    ? "border border-dashed border-accent bg-accent-light"
                    : "bg-accent"
                } ${isHover ? "opacity-85" : "opacity-100"}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-3.5 text-center text-[11px] text-text-tertiary">
        {data.map((d) => (
          <div key={d.label} className="flex-1">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
