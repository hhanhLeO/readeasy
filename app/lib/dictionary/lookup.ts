import { asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "../db";
import {
  dictionaryEntries,
  dictionaryForms,
  DictionaryPosGroup,
} from "../db/schema";

const MAX_HEADWORDS = 4;

export type DictionaryResult = {
  headword: string;
  ipa: string | null;
  entries: DictionaryPosGroup[];
};

function candidateSpellings(word: string): string[] {
  const base = word.trim().toLowerCase().replace(/’/g, "'");
  if (!base) return [];
  const withoutPossessive = base.replace(/'s?$/, "");
  return [...new Set([base, withoutPossessive].filter(Boolean))];
}

function formatIpa(ipa: string | null): string | null {
  if (!ipa) return null;
  return /^[/[]/.test(ipa) ? ipa : `/${ipa}/`;
}

export async function lookupDictionary(
  word: string,
): Promise<DictionaryResult[]> {
  const spellings = candidateSpellings(word);
  if (spellings.length === 0) return [];

  const matchingForms = db
    .select({ entryId: dictionaryForms.entryId })
    .from(dictionaryForms)
    .where(inArray(dictionaryForms.form, spellings));

  const rows = await db
    .select({
      headword: dictionaryEntries.headword,
      ipa: dictionaryEntries.ipa,
      entries: dictionaryEntries.entries,
    })
    .from(dictionaryEntries)
    .where(
      or(
        inArray(dictionaryEntries.headword, spellings),
        inArray(dictionaryEntries.id, matchingForms),
      ),
    )
    .orderBy(
      sql`${dictionaryEntries.freqTier} asc nulls last`,
      desc(inArray(dictionaryEntries.headword, spellings)),
      asc(dictionaryEntries.headword),
    )
    .limit(MAX_HEADWORDS);
  return rows.map((r) => ({ ...r, ipa: formatIpa(r.ipa) }));
}

export async function resolveHeadwords(word: string): Promise<string[]> {
  const results = await lookupDictionary(word);
  return results.map((r) => r.headword);
}

export async function formsOfHeadwords(headwords: string[]): Promise<string[]> {
  if (headwords.length === 0) return [];
  const rows = await db
    .select({ form: dictionaryForms.form })
    .from(dictionaryForms)
    .innerJoin(dictionaryEntries, eq(dictionaryForms.entryId, dictionaryEntries.id))
    .where(inArray(dictionaryEntries.headword, headwords));
  return rows.map((r) => r.form);
}
