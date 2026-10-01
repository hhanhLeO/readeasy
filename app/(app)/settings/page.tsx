import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { count, eq } from "drizzle-orm";
import { db } from "@/app/lib/db";
import { users, words } from "@/app/lib/db/schema";
import { getCurrentUser } from "@/app/lib/auth/dal";
import { getLlmQuota } from "@/app/lib/llm/quota";
import { logout } from "@/app/(auth)/actions";
import { getDisplayStreak } from "../lib/streak";
import { SettingsCard } from "./components/settings-card";
import { DetailsForm } from "./components/details-form";
import { PasswordForm } from "./components/password-form";
import { DeleteAccount } from "./components/delete-account";

export const metadata: Metadata = {
  title: "Settings - ReadEasy AI",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const [[account], [{ wordCount }], quota] = await Promise.all([
    db
      .select({ createdAt: users.createdAt, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1),
    db.select({ wordCount: count() }).from(words).where(eq(words.userId, user.id)),
    getLlmQuota(user.id),
  ]);
  const streakDays = getDisplayStreak(user);
  const since = account.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-[780px] px-8 py-10 pb-20">
      <h1 className="mb-5 text-2xl font-bold text-foreground">Settings</h1>

      {/* Profile header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#0D9488,#6366F1)] text-lg font-semibold text-white">
          {user.username.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[17px] font-semibold">{user.username}</div>
          <div className="truncate text-[13.5px] text-text-secondary">
            {user.email} · Learning since {since}
          </div>
        </div>
        <div className="flex gap-[22px] text-right">
          <div>
            <div className="text-xl font-bold">{wordCount}</div>
            <div className="text-[11.5px] text-text-tertiary">words saved</div>
          </div>
          <div>
            <div className="text-xl font-bold">{streakDays}</div>
            <div className="text-[11.5px] text-text-tertiary">day streak</div>
          </div>
        </div>
      </div>

      <DetailsForm username={user.username} email={user.email} />

      <SettingsCard
        title="AI lookups"
        desc="The dictionary is always free to use. AI explanations in context are limited per day."
      >
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-semibold">
            {quota.limit - quota.used} of {quota.limit} left today
          </span>
          <span className="text-xs text-text-tertiary">Resets at midnight</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
          <div className="h-full bg-accent" style={{ width: `${(quota.used / quota.limit) * 100}%` }} />
        </div>
      </SettingsCard>

      <PasswordForm hasPassword={account.passwordHash !== null} />

      <DeleteAccount />

      <form action={logout} className="mt-6 text-center">
        <button
          type="submit"
          className="inline-flex cursor-pointer items-center justify-center rounded-lg px-3 py-1.5 text-[13px] font-medium text-accent hover:bg-accent-tint"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
