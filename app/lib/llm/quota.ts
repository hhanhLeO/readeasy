import "server-only";
import { and, eq, lt, or, sql } from "drizzle-orm";
import { db } from "@/app/lib/db";
import { NEXT_MIDNIGHT_VN, users } from "@/app/lib/db/schema";

// Max LLM lookups a single user can make per calendar day (Vietnam time).
const DAILY_LLM_CALL_LIMIT = Number(process.env.DAILY_LLM_CALL_LIMIT) || 5;

export async function consumeLlmQuota(userId: string): Promise<boolean> {
  const [row] = await db
    .update(users)
    .set({
      llmCallsToday: sql`case when now() >= ${users.llmCallsResetAt} then 1 else ${users.llmCallsToday} + 1 end`,
      llmCallsResetAt: sql`case when now() >= ${users.llmCallsResetAt} then ${NEXT_MIDNIGHT_VN} else ${users.llmCallsResetAt} end`,
    })
    .where(
      and(
        eq(users.id, userId),
        or(sql`now() >= ${users.llmCallsResetAt}`, lt(users.llmCallsToday, DAILY_LLM_CALL_LIMIT))
      )
    )
    .returning({ llmCallsToday: users.llmCallsToday });

  return row !== undefined;
}

export async function getLlmQuota(userId: string): Promise<{ used: number; limit: number }> {
  const [row] = await db
    .select({
      used: sql<number>`case when now() >= ${users.llmCallsResetAt} then 0 else ${users.llmCallsToday} end`,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return { used: Math.min(Number(row?.used ?? 0), DAILY_LLM_CALL_LIMIT), limit: DAILY_LLM_CALL_LIMIT };
}