import { defineConfig } from 'drizzle-kit';

// drizzle-kit needs a session-mode connection. On Supabase, point
// MIGRATION_DATABASE_URL at the session pooler (port 5432); the transaction
// pooler (port 6543) used by the app does not support prepared statements.
const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error('DATABASE_URL is not set.');
}

export default defineConfig({
  schema: "./app/lib/db/schema.ts",
  out: "./app/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
});
