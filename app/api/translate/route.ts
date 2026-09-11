import { lookupWord, WordLookup } from '@/app/lib/dictionary/word-lookup';
import { consumeLlmQuota } from '@/app/lib/dictionary/quota';
import { getCurrentUser } from '@/app/lib/auth/dal';

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

  const allowed = await consumeLlmQuota(user.id);
  if (!allowed) {
    return Response.json(
      { error: 'Daily lookup limit reached. Try again tomorrow.' },
      { status: 429 }
    );
  }

  let result: WordLookup | null;
  try {
    result = await lookupWord({ word, sentence });
  } catch (err) {
    console.error('lookupWord failed', err);
    result = null;
  }

  if (!result) {
    return Response.json(
      { error: 'Failed to generate a lookup' },
      { status: 500 },
    );
  }

  return Response.json(result);
}
