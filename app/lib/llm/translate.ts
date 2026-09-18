import { z } from "zod";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

const TextTranslationSchema = z.object({
  translation: z
    .string()
    .describe("Vietnamese translation of the full sentence/passage"),
  note: z
    .string()
    .nullable()
    .describe(
      "Short Vietnamese note on tricky grammar, idioms, or phrasing in the passage — null if nothing stands out",
    ),
});

export type TextTranslation = z.infer<typeof TextTranslationSchema>;

function buildPrompt(text: string) {
  return `Translate the following English passage into natural Vietnamese. If there's tricky grammar, an idiom, or phrasing worth explaining, add a short note about it written in Vietnamese too — otherwise leave the note null.\n\n"${text}"`;
}

let client: OpenAI | undefined;
function getClient() {
  if (!client) client = new OpenAI();
  return client;
}

export async function translateText({
  text,
}: {
  text: string;
}): Promise<TextTranslation | null> {
  const response = await getClient().responses.parse({
    model: "gpt-4o-mini",
    input: buildPrompt(text),
    text: {
      format: zodTextFormat(TextTranslationSchema, "text_translation"),
    },
    max_output_tokens: 512,
  });

  return response.output_parsed;
}
