import { getCurrentUser } from "@/app/lib/auth/dal";
import { lookupDictionary } from "@/app/lib/dictionary/lookup";

const MAX_WORD_LENGTH = 60;

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const word = new URL(request.url).searchParams.get("word")?.trim() ?? "";
  if (!word || word.length > MAX_WORD_LENGTH) {
    return Response.json({ error: "word is required" }, { status: 400 });
  }

  const results = await lookupDictionary(word);
  return Response.json({ results });
}
