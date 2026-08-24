import { lookupWord, WordLookup } from '@/app/lib/openai/word-lookup';
import { getCurrentUser } from '@/app/lib/utils/auth';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const word = typeof body?.word === 'string' ? body.word : '';
  const sentence = typeof body?.sentence === 'string' ? body.sentence : '';
  if (!word || !sentence) {
    return Response.json(
      { error: 'word and sentence are required' },
      { status: 400 },
    );
  }

  let result: WordLookup | null;
  try {
    result = await lookupWord({ word, sentence });
  } catch {
    return Response.json(
      { error: 'Failed to generate a lookup' },
      { status: 500 },
    );
  }

  if (!result) {
    return Response.json(
      { error: 'Failed to generate a lookup' },
      { status: 500 },
    );
  }

  return Response.json(result);
}
