import 'server-only';
import { cache } from 'react';
import { db } from '@/app/lib/db';
import { users } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from './session';

/* Get current user */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const [user] = await db
    .select({ id: users.id, username: users.username, email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user ?? null;
});
