import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/app/lib/auth/dal";
import { getDisplayStreak } from "../lib/streak";
import { getDueBreakdown, getRecentActivity, getRetentionRate, getWeeklyWordCounts } from "./lib/stats";
import { WordsBarChart } from "./components/words-bar-chart";

export const metadata: Metadata = {
  title: "Progress - ReadEasy AI",
};

export default async function ProgressPage() {
  const user = await getCurrentUser();

  const [breakdown, weeklyWords, retentionRate, activity] = user
    ? await Promise.all([
        getDueBreakdown(user.id),
        getWeeklyWordCounts(user.id),
        getRetentionRate(user.id),
        getRecentActivity(user.id),
      ])
    : [
        { total: 0, dueToday: 0, dueThisWeek: 0, mastered: 0, scheduledLater: 0, savedThisWeek: 0 },
        [],
        null,
        [],
      ];
  const streakDays = user ? getDisplayStreak(user) : 0;

  const total = Math.max(1, breakdown.total);
  const dueBars = [
    { label: "Due today", value: breakdown.dueToday, color: "bg-accent" },
    { label: "Due this week", value: breakdown.dueThisWeek, color: "bg-warning" },
    { label: "Mastered (no review needed)", value: breakdown.mastered, color: "bg-success" },
    { label: "Scheduled later", value: breakdown.scheduledLater, color: "bg-border-strong" },
  ];

  return (
    <div className="mx-auto max-w-[1080px] px-8 py-10 pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Your Progress</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Keep up the momentum — consistency beats intensity.
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon="📚" value={breakdown.total} label="words saved" trend={breakdown.savedThisWeek > 0 ? `+${breakdown.savedThisWeek} this week` : undefined} />
        <StatCard icon="✅" value={breakdown.mastered} label="mastered" />
        <StatCard
          icon="🔥"
          value={streakDays}
          label="day streak"
          trend={streakDays > 0 ? "Keep it going" : "Start today"}
          accent
        />
        <StatCard
          icon="📈"
          value={retentionRate !== null ? `${retentionRate}%` : "—"}
          label="retention rate (30d)"
          trend={retentionRate === null ? "No reviews yet" : undefined}
        />
      </div>

      {/* Words learned chart */}
      <ChartCard title="Words learned" subtitle="Last 8 weeks" className="mb-6">
        <WordsBarChart data={weeklyWords} />
      </ChartCard>

      {/* Words due breakdown */}
      <ChartCard title="Words due breakdown" className="mb-6">
        <div className="flex flex-col gap-4 p-5">
          {dueBars.map((b) => (
            <div key={b.label}>
              <div className="mb-1.5 flex justify-between text-[13px]">
                <span className="text-text-secondary">{b.label}</span>
                <span className="font-semibold">{b.value} words</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg-tertiary">
                <div
                  style={{ width: `${(b.value / total) * 100}%` }}
                  className={`h-full rounded-full transition-[width] duration-500 ${b.color}`}
                />
              </div>
            </div>
          ))}
          <Link
            href="/review"
            className="mt-2 inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-all duration-150 hover:-translate-y-px hover:bg-accent-dark hover:shadow-[0_4px_10px_rgba(13,148,136,0.25)]"
          >
            Start today&apos;s review <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      </ChartCard>

      {/* Recent activity */}
      <ChartCard title="Recent activity">
        {activity.length > 0 ? (
          <div className="flex flex-col">
            {activity.map((a, i) => (
              <div
                key={a.key}
                className={`flex items-center gap-3.5 px-5 py-3.5 ${i < activity.length - 1 ? "border-b border-border" : ""}`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-bg-secondary text-base">
                  {a.icon}
                </span>
                <span className="min-w-[110px] text-[13px] font-medium text-text-secondary">
                  {a.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="flex-1 text-sm text-foreground">{a.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-5 text-sm text-text-secondary">
            No activity yet — read an article or run a review session to see it here.
          </p>
        )}
      </ChartCard>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  trend,
  accent,
}: {
  icon: string;
  value: string | number;
  label: string;
  trend?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div
        className={`mb-3 grid h-10 w-10 place-items-center rounded-[10px] text-lg ${accent ? "bg-accent-tint" : "bg-bg-secondary"}`}
      >
        {icon}
      </div>
      <div
        className={`mb-1.5 font-serif text-[32px] leading-none font-bold tracking-[-0.02em] ${accent ? "text-accent-dark" : "text-foreground"}`}
      >
        {value}
      </div>
      <div className="mb-2 text-[13px] text-text-secondary">{label}</div>
      {trend && <div className="text-[11px] font-semibold text-text-tertiary">{trend}</div>}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-white shadow-sm ${className}`}>
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        {subtitle && <div className="mt-0.5 text-xs text-text-tertiary">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
