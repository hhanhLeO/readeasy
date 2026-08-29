// Canonical SM-2 (SuperMemo 2). The UI collects one of 4 buttons
// (Again/Hard/Good/Easy) and maps it to the 0-5 quality score SM-2 expects.
export type Rating = 1 | 2 | 3 | 4;

const QUALITY: Record<Rating, number> = { 1: 1, 2: 3, 3: 4, 4: 5 };

export type Sm2State = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
};

export function applySm2(
  state: Sm2State,
  rating: Rating,
  now: Date = new Date(),
): Sm2State & { nextReviewAt: Date } {
  const quality = QUALITY[rating];

  let repetitions = state.repetitions;
  let intervalDays: number;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) intervalDays = 1;
    else if (repetitions === 1) intervalDays = 6;
    else intervalDays = Math.round(state.intervalDays * state.easeFactor);
    repetitions += 1;
  }

  const easeFactor = Math.max(
    1.3,
    state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return { easeFactor, intervalDays, repetitions, nextReviewAt };
}
