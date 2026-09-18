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
