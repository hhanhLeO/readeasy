'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Book, BookOpen, BarChart3, Brain } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/articles', label: 'All Articles', icon: Book },
  { href: '/words', label: 'My Words', icon: BookOpen },
  { href: '/progress', label: 'Progress', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[220px] shrink-0 flex-col gap-1 border-r border-border bg-bg-secondary p-3">
      <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-[0.08em] text-text-tertiary uppercase">
        Library
      </div>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-all duration-100 ${
              active
                ? 'border-accent bg-accent-tint text-accent-dark'
                : 'border-transparent text-text-secondary hover:bg-bg-tertiary hover:text-foreground'
            }`}
          >
            <Icon size={16} strokeWidth={2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
      <div className="flex-1" />
      <div className="m-2 rounded-lg border border-border bg-white p-3 text-[13px]">
        <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
          <Brain size={14} strokeWidth={2} />
          Today&apos;s Review
        </div>
        <div className="mb-2 text-xs text-text-secondary">12 words due</div>
        <Link
          href="/review"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-all duration-150 hover:-translate-y-px hover:bg-accent-dark hover:shadow-[0_4px_10px_rgba(13,148,136,0.25)]"
        >
          Start review
        </Link>
      </div>
    </aside>
  );
}
