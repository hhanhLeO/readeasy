import Link from 'next/link';
import { CEFRBadge } from './cefr-badge';

export type Article = {
  id: string;
  title: string;
  minutes: number;
  source?: string;
  level?: string;
  topic?: string;
  cover?: string;
};

const DEFAULT_COVER = 'linear-gradient(135deg, #334155 0%, #0F172A 100%)';

export function ArticleCard({
  article,
  progress,
}: {
  article: Article;
  progress?: number;
}) {
  return (
    <Link
      href={`/read/${article.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)]"
    >
      <div
        className="relative aspect-video overflow-hidden"
        style={{ background: article.cover ?? DEFAULT_COVER }}
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.15)_0_2px,transparent_2px_12px)]" />
        {article.source && (
          <span className="absolute top-2.5 left-2.5 rounded bg-[rgba(15,23,42,0.85)] px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-[4px]">
            {article.source}
          </span>
        )}
        {article.level && (
          <span className="absolute top-2.5 right-2.5">
            <CEFRBadge
              level={article.level}
              className="!bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-4 pt-3.5 pb-4">
        <div className="line-clamp-2 text-pretty font-serif text-base leading-[1.35] font-bold text-foreground transition-colors duration-150 group-hover:text-accent-dark">
          {article.title}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>{article.minutes} min</span>
          {article.topic && (
            <>
              <span className="h-[3px] w-[3px] rounded-full bg-text-tertiary" />
              <span>{article.topic}</span>
            </>
          )}
        </div>
        {progress != null && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-bg-tertiary">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}
