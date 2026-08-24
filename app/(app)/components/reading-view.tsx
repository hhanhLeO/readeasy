'use client';

import { useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { WordPopup } from './word-popup';

type Selection = {
  id: number;
  word: string;
  sentence: string;
  rect: DOMRect;
  tokenId: string | null;
};

const MAX_SELECTION_LENGTH = 60;

function stripWord(token: string): string {
  return token.replace(/^[^A-Za-zÀ-ÿ'’]+|[^A-Za-zÀ-ÿ'’]+$/g, '');
}

function tokenizeParagraph(text: string): string[] {
  return text.split(/(\s+)/);
}

function findSentence(paragraphText: string, selected: string): string {
  const sentences = paragraphText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.find((s) => s.includes(selected)) ?? paragraphText;
}

function findParagraphText(node: Node | null): string {
  let current: Node | null = node;
  while (current) {
    if (current instanceof HTMLElement && current.tagName === 'P') {
      return current.textContent ?? '';
    }
    current = current.parentNode;
  }
  return '';
}

export function ReadingView({
  documentId,
  paragraphs,
}: {
  documentId: string;
  paragraphs: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nextSelectionId = useRef(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function openSelection(next: Omit<Selection, 'id'>) {
    nextSelectionId.current += 1;
    setSelection({ id: nextSelectionId.current, ...next });
  }

  function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    const sel = window.getSelection();
    if (!sel) return;

    // Dragged across text — support looking up a whole phrase.
    if (!sel.isCollapsed && containerRef.current?.contains(sel.anchorNode)) {
      const text = sel.toString().trim();
      if (!text || text.length > MAX_SELECTION_LENGTH) return;

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const paragraphText = findParagraphText(sel.anchorNode) || text;
      openSelection({
        word: text,
        sentence: findSentence(paragraphText, text),
        rect,
        tokenId: null,
      });
      return;
    }

    // A plain click (no drag) — look up the single word under the cursor.
    const target = (e.target as HTMLElement).closest(
      '[data-word]',
    ) as HTMLElement | null;
    if (!target || !containerRef.current?.contains(target)) return;

    const word = target.dataset.word;
    if (!word) return;

    const rect = target.getBoundingClientRect();
    const paragraphText = findParagraphText(target) || word;
    openSelection({
      word,
      sentence: findSentence(paragraphText, word),
      rect,
      tokenId: target.dataset.tokenId ?? null,
    });
  }

  function handleDismiss() {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }

  function handleSaved(word: string) {
    setToast(`Saved "${word}" to your vocab`);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <>
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="font-serif text-lg leading-[1.8] text-foreground"
      >
        {paragraphs.map((para, pi) => (
          <p key={pi} className="mb-5 text-pretty">
            {tokenizeParagraph(para).map((token, ti) => {
              if (token.trim() === '') return token;

              const word = stripWord(token);
              if (!word) return <span key={ti}>{token}</span>;

              const tokenId = `${pi}-${ti}`;
              const isActive = selection?.tokenId === tokenId;

              return (
                <span
                  key={ti}
                  data-word={word}
                  data-token-id={tokenId}
                  className={isActive ? 'word-active' : 'word'}
                >
                  {token}
                </span>
              );
            })}
          </p>
        ))}
      </div>

      {selection && (
        <WordPopup
          key={selection.id}
          word={selection.word}
          sentence={selection.sentence}
          rect={selection.rect}
          documentId={documentId}
          onDismiss={handleDismiss}
          onSaved={handleSaved}
        />
      )}

      {toast && (
        <div className="fixed top-[76px] right-6 z-[100] flex min-w-60 items-center gap-2.5 rounded-lg border-l-[3px] border-success bg-white px-4 py-3 text-sm shadow-lg">
          <Check size={16} className="text-success" />
          <span>{toast}</span>
        </div>
      )}
    </>
  );
}
