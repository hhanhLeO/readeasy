import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/app/lib/db";
import { users } from "@/app/lib/db/schema";

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Only needs the `.update()` method, so both `db` and a transaction's `tx` satisfy this
type Executor = { update: typeof db.update };

// Call this whenever the user does something that should count toward the
// streak (adding a document, submitting a review) — NOT when displaying it.
export async function recordActivity(userId: string, executor: Executor = db): Promise<void> {
  const today = toIsoDate(new Date());
  const yesterday = toIsoDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

  await executor
    .update(users)
    .set({
      currentStreak: sql`case
        when ${users.lastActiveDate} = ${today} then ${users.currentStreak}
        when ${users.lastActiveDate} = ${yesterday} then ${users.currentStreak} + 1
        else 1
      end`,
      lastActiveDate: today,
    })
    .where(eq(users.id, userId));
}

// Pure, no DB call - reads whatever getCurrentUser() already fetched
export function getDisplayStreak(user: { currentStreak: number; lastActiveDate: string | null }): number {
  if (!user.lastActiveDate) return 0;

  const today = toIsoDate(new Date());
  const yesterday = toIsoDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

  return user.lastActiveDate === today || user.lastActiveDate === yesterday ? user.currentStreak : 0;
}
