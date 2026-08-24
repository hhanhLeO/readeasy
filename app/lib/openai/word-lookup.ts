import { z } from 'zod';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';

const WordLookupSchema = z.object({
  meaning: z
    .string()
    .describe(
      'Vietnamese meaning of the word as used in this specific sentence',
    ),
  phonetic: z.string().describe('IPA phonetic transcription of the word'),
  partOfSpeech: z
    .string()
    .describe(
      'Part of speech as used in this sentence (noun, verb, adjective, etc.',
    ),
  explanation: z
    .string()
    .describe(
      'A short Vietnamese explanation of how the word is used in this context',
    ),
});

export type WordLookup = z.infer<typeof WordLookupSchema>;

function buildPrompt(word: string, sentence: string): string {
  return `An English learner selected the word "${word}" in this sentence: "${sentence}"\n\nExplain what "${word}" means specifically as used in that sentence.`;
}

let client: OpenAI | undefined;
function getClient() {
  if (!client) client = new OpenAI();
  return client;
}

export async function lookupWord({
  word,
  sentence,
}: {
  word: string;
  sentence: string;
}): Promise<WordLookup | null> {
  const response = await getClient().responses.parse({
    model: 'gpt-4o-mini',
    input: buildPrompt(word, sentence),
    text: {
      format: zodTextFormat(WordLookupSchema, 'word_lookup'),
    },
    max_output_tokens: 512,
  });

  return response.output_parsed;
}
