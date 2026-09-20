'use client';

import { useEffect, useRef } from 'react';
import { saveReadingProgressAction } from '@/app/(app)/actions/documents';
import { COMPLETED_PERCENT } from '@/app/(app)/lib/format';

const SAVE_DELAY_MS = 1500;
// Below this a saved position isn't worth scrolling back to.s
const RESTORE_MIN = 1;

function findScrollParent(node: HTMLElement | null): HTMLElement | null {
  let current = node?.parentElement ?? null;
  while (current) {
    const { overflowY } = getComputedStyle(current);
    if (overflowY === 'auto' || overflowY === 'scroll') return current;
    current = current.parentElement;
  }
  return null;
}

function readPercent(el: HTMLElement): number {
  const max = el.scrollHeight - el.clientHeight;
  // Nothing to scroll: the whole article is already visible.
  if (max <= 0) return 100;
  return (el.scrollTop / max) * 100;
}

// Renders nothing; restores the last scroll position on mount and saves the
// current one (debounced) as the user reads. Opening also bumps last_read_at.
export function ReadingProgressTracker({
  documentId,
  initialPosition,
}: {
  documentId: string;
  initialPosition: number;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const scroller = findScrollParent(anchorRef.current);
    if (!scroller) return;

    if (initialPosition >= RESTORE_MIN && initialPosition < COMPLETED_PERCENT) {
      const max = scroller.scrollHeight - scroller.clientHeight;
      scroller.scrollTop = (initialPosition / 100) * max;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      void saveReadingProgressAction(documentId, readPercent(scroller));
    };
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(save, SAVE_DELAY_MS);
    };

    save();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, [documentId, initialPosition]);

  return <span ref={anchorRef} hidden />;
}
