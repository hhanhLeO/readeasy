import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { z } from "zod";
import {
  DICTIONARY_POS,
  dictionaryEntries,
  dictionaryForms,
  type DictionaryPos,
  type DictionaryPosGroup,
  type NewDictionaryEntry,
} from "../app/lib/db/schema.ts";

const DATA_DIR = path.join(import.meta.dirname, "..", "data", "dictionary");
const BATCH_SIZE = 1000;

// Everything the adapters produce, before it has a database id.
type ImportedEntry = Omit<NewDictionaryEntry, "id"> & { forms: string[] };

// Postgres doesn't validate what goes into a jsonb column, so this is the
// only thing standing between a bad adapter and malformed rows.
const PosGroupsSchema = z
  .array(
    z.object({
      pos: z.enum(DICTIONARY_POS),
      senses: z
        .array(
          z.object({
            vi: z.string().min(1),
            en: z.string().min(1).optional(),
            examples: z
              .array(z.object({ en: z.string().min(1), vi: z.string().min(1) }))
              .optional(),
          })
        )
        .min(1),
    })
  )
  .min(1);

async function* readJsonl(file: string): AsyncGenerator<unknown> {
  const lines = createInterface({ input: createReadStream(path.join(DATA_DIR, file)) });
  for await (const line of lines) {
    if (line.trim()) yield JSON.parse(line);
  }
}

// Merges groups that share a POS (e.g. ovdp's "ngoại động từ" and "nội động
// từ" both become "v"), keeping first-seen order.
function mergeByPos(groups: DictionaryPosGroup[]): DictionaryPosGroup[] {
  const byPos = new Map<DictionaryPos, DictionaryPosGroup>();
  for (const g of groups) {
    const existing = byPos.get(g.pos);
    if (existing) existing.senses.push(...g.senses);
    else byPos.set(g.pos, { pos: g.pos, senses: [...g.senses] });
  }
  return [...byPos.values()];
}

const clean = (s: unknown) => (typeof s === "string" ? s.trim() : "");

// --- thichhoc ---

type ThichhocRow = {
  word: string;
  ipa?: string;
  forms?: { form: string }[];
  senses: {
    pos: string;
    glosses: { gloss: string; en?: string }[];
    freq_tier: number;
  }[];
};

const THICHHOC_POS: Record<string, DictionaryPos> = {
  n: "n",
  v: "v",
  adj: "adj",
  adv: "adv",
};

function adaptThichhoc(row: ThichhocRow): ImportedEntry {
  const headword = clean(row.word).toLowerCase();
  return {
    headword,
    ipa: clean(row.ipa) || null,
    source: "thichhoc",
    // An entry is as common as its most common POS.
    freqTier: Math.min(...row.senses.map((s) => s.freq_tier)),
    entries: mergeByPos(
      row.senses.map((s) => ({
        pos: THICHHOC_POS[s.pos] ?? "other",
        senses: s.glosses
          .map((g) => ({ vi: clean(g.gloss), en: clean(g.en) || undefined }))
          .filter((g) => g.vi),
      }))
    ).filter((g) => g.senses.length > 0),
    forms: [
      ...new Set(
        (row.forms ?? [])
          .map((f) => clean(f.form).toLowerCase())
          .filter((f) => f && f !== headword)
      ),
    ],
  };
}

// --- ovdp ---

type OvdpRow = {
  word: string;
  ipa?: string;
  senses: {
    pos?: string;
    glosses: { gloss: string; examples?: { en: string; vi: string }[] }[];
  }[];
  specialized?: { field: string; glosses: string[] }[];
};

// ovdp's POS labels are free text with 100+ variants ("danh từ (từ Mỹ",
// "(bất qui tắc) ngoại động từ bestrode", "tính từ & phó từ"…), so match on
// the leading keyword. Order matters: more specific prefixes come first
// ("tính từ sở hữu" before "tính từ", "động tính từ" before "động từ").
const OVDP_POS_PREFIXES: [string, DictionaryPos][] = [
  ["tính từ sở hữu", "det"],
  ["mạo từ", "det"],
  ["danh từ", "n"],
  ["tính từ", "adj"],
  ["định ngữ", "adj"],
  ["động tính từ", "adj"],
  ["ngoại động từ", "v"],
  ["nội động từ", "v"],
  ["trợ động từ", "v"],
  ["động từ", "v"],
  ["phó từ", "adv"],
  ["giới từ", "prep"],
  ["liên từ", "conj"],
  ["đại từ", "pron"],
  ["thán từ", "interj"],
  ["(viết tắt)", "abbr"],
];

function mapOvdpPos(label: string | undefined): DictionaryPos {
  const normalized = clean(label).replace(/^\(bất qui tắc\)\s*/, "");
  return OVDP_POS_PREFIXES.find(([prefix]) => normalized.startsWith(prefix))?.[1] ?? "other";
}

function adaptOvdp(row: OvdpRow): ImportedEntry {
  const general: DictionaryPosGroup[] = row.senses.map((s) => ({
    pos: mapOvdpPos(s.pos),
    senses: s.glosses
      .map((g) => {
        const examples = (g.examples ?? [])
          .map((ex) => ({ en: clean(ex.en), vi: clean(ex.vi) }))
          .filter((ex) => ex.en && ex.vi);
        return { vi: clean(g.gloss), examples: examples.length ? examples : undefined };
      })
      .filter((g) => g.vi),
  }));

  // Domain-specific meanings ("(xây dựng) mặc dù") have no POS; they go
  // last, labelled with their field, so general senses show first.
  const specialized: DictionaryPosGroup[] = (row.specialized ?? []).map((sp) => ({
    pos: "other",
    senses: sp.glosses
      .map((g) => clean(g))
      .filter(Boolean)
      .map((g) => ({ vi: `(${clean(sp.field)}) ${g}` })),
  }));

  return {
    headword: clean(row.word).toLowerCase(),
    ipa: clean(row.ipa) || null,
    source: "ovdp",
    freqTier: null,
    entries: mergeByPos([...general, ...specialized]).filter((g) => g.senses.length > 0),
    forms: [],
  };
}

// --- pipeline ---

// Adapts every row, merging rows whose headwords collide once lowercased
// (ovdp has both "Bank" and "bank").
async function collect<Row>(
  file: string,
  adapt: (row: Row) => ImportedEntry,
  skip: (headword: string) => boolean = () => false
): Promise<Map<string, ImportedEntry>> {
  const out = new Map<string, ImportedEntry>();
  let invalid = 0;
  for await (const raw of readJsonl(file)) {
    const entry = adapt(raw as Row);
    if (!entry.headword || skip(entry.headword)) continue;

    const existing = out.get(entry.headword);
    if (existing) {
      existing.entries = mergeByPos([...existing.entries, ...entry.entries]);
      existing.ipa ??= entry.ipa;
      existing.forms = [...new Set([...existing.forms, ...entry.forms])];
      continue;
    }
    if (!PosGroupsSchema.safeParse(entry.entries).success) {
      invalid++;
      continue;
    }
    out.set(entry.headword, entry);
  }
  console.log(`${file}: ${out.size} entries (${invalid} skipped as invalid)`);
  return out;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
  const db = drizzle(client);

  try {
    const thichhoc = await collect<ThichhocRow>("thichhoc.jsonl", adaptThichhoc);
    const ovdp = await collect<OvdpRow>("ovdp.jsonl", adaptOvdp, (hw) => thichhoc.has(hw));
    const all = [...thichhoc.values(), ...ovdp.values()];

    await db.transaction(async (tx) => {
      // Cascades to dictionary_forms.
      await tx
        .delete(dictionaryEntries)
        .where(inArray(dictionaryEntries.source, ["thichhoc", "ovdp"]));

      let entryCount = 0;
      let formCount = 0;
      for (const batch of chunk(all, BATCH_SIZE)) {
        // A conflict here means a "custom" row already owns the headword;
        // it's skipped and so are its forms, since it didn't return an id.
        const inserted = await tx
          .insert(dictionaryEntries)
          .values(
            batch.map(({ headword, ipa, source, freqTier, entries }) => ({
              headword,
              ipa,
              source,
              freqTier,
              entries,
            }))
          )
          .onConflictDoNothing({ target: dictionaryEntries.headword })
          .returning({ id: dictionaryEntries.id, headword: dictionaryEntries.headword });
        entryCount += inserted.length;

        const formsByHeadword = new Map(batch.map((e) => [e.headword, e.forms]));
        const formRows = inserted.flatMap(({ id, headword }) =>
          (formsByHeadword.get(headword) ?? []).map((form) => ({ form, entryId: id }))
        );
        for (const formBatch of chunk(formRows, BATCH_SIZE)) {
          await tx.insert(dictionaryForms).values(formBatch).onConflictDoNothing();
          formCount += formBatch.length;
        }
        process.stdout.write(`\rinserted ${entryCount}/${all.length} entries`);
      }
      console.log(`\ndone: ${entryCount} entries, ${formCount} forms`);
    });
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
