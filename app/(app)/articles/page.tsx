import type { Metadata } from "next";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/app/lib/auth/dal";
import { db } from "@/app/lib/db";
import { documents } from "@/app/lib/db/schema";
import { estimateMinutes } from "../lib/format";
import type { Article } from "../lib/type";
import { LibraryBrowser } from "./components/articles-browser";

export const metadata: Metadata = {
  title: "All Articles - ReadEasy AI",
};

export default async function LibraryPage() {
  const user = await getCurrentUser();

  const rows = user
    ? await db
        .select({
          id: documents.id,
          title: documents.title,
          content: documents.content,
        })
        .from(documents)
        .where(eq(documents.userId, user.id))
        .orderBy(desc(documents.createdAt))
    : [];

  const articles: Article[] = rows.map((doc) => ({
    id: doc.id,
    title: doc.title,
    minutes: estimateMinutes(doc.content),
  }));

  return (
    <div className="mx-auto max-w-[960px] px-8 py-10 pb-20">
      <LibraryBrowser articles={articles} />
    </div>
  );
}
