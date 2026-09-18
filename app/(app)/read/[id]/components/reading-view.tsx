'use client';

import { useRef, useState, useMemo } from 'react';
import { Check } from 'lucide-react';
import { WordPopup } from './word-popup';
import { TranslationPopup } from './translation-popup';

type WordSelection = {
  kind: 'word';
  id: number;
  word: string;
  sentence: string;
  rect: DOMRect;
  tokenId: string | null;
};

type TextSelection = {
  kind: 'text';
  id: number;
  text: string;
  rect: DOMRect;
};

type Selection = WordSelection | TextSelection;

type NewSelection = Omit<WordSelection, 'id'> | Omit<TextSelection, 'id'>;

const MAX_SELECTION_LENGTH = 60;
const MAX_TEXT_LENGTH = 500;

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

// Block-level tags a paragraph can render as — see parseBlock() below.
// Kept in sync so word/phrase lookup can find the right containing block.
const BLOCK_TAGS = new Set(['P', 'H2', 'H3', 'H4', 'H5']);

function findParagraphText(node: Node | null): string {
  let current: Node | null = node;
  while (current) {
    if (current instanceof HTMLElement && BLOCK_TAGS.has(current.tagName)) {
      return current.textContent ?? '';
    }
    current = current.parentNode;
  }
  return '';
}

// URL-imported articles mark headings with a markdown-style `#`/`##`/`###`/`####`
// prefix (added in app/lib/extract/readability.ts) so they render distinctly
// from body paragraphs without needing a richer content format.
const HEADING_PATTERN = /^(#{1,4})\s+(.*)$/;
const HEADING_TAGS = ['h2', 'h3', 'h4', 'h5'] as const;
const HEADING_CLASSES = [
  'mt-8 mb-3 text-pretty font-serif text-2xl font-bold text-foreground',
  'mt-7 mb-3 text-pretty font-serif text-xl font-bold text-foreground',
  'mt-6 mb-2.5 text-pretty font-serif text-lg font-semibold text-foreground',
  'mt-6 mb-2.5 text-pretty font-serif text-base font-semibold text-foreground',
];

function parseBlock(para: string): {
  tag: 'p' | (typeof HEADING_TAGS)[number];
  text: string;
  className: string;
} {
  const match = para.match(HEADING_PATTERN);
  if (!match) return { tag: 'p', text: para, className: 'mb-5 text-pretty' };

  const level = match[1].length;
  return { tag: HEADING_TAGS[level - 1], text: match[2], className: HEADING_CLASSES[level - 1] };
}

export function ReadingView({
  documentId,
  paragraphs,
  savedWords,
}: {
  documentId: string;
  paragraphs: string[];
  savedWords: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nextSelectionId = useRef(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const savedWordSet = useMemo(() => new Set(savedWords), [savedWords]);

  function openSelection(next: NewSelection) {
    nextSelectionId.current += 1;
    setSelection({ ...next, id: nextSelectionId.current });
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    const sel = window.getSelection();
    if (!sel) return;

    // Dragged across text.
    if (!sel.isCollapsed && containerRef.current?.contains(sel.anchorNode)) {
      const text = sel.toString().trim();
      if (!text) return;

      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const wordCount = text.split(/\s+/).filter(Boolean).length;

      // More than one word — translate the whole selection instead of
      // treating it as a vocab lookup.
      if (wordCount > 1) {
        if (text.length > MAX_TEXT_LENGTH) {
          showToast('Selected text is too long to translate.');
          return;
        }
        openSelection({ kind: 'text', text, rect });
        return;
      }

      // A single word, just selected by dragging instead of clicking.
      if (text.length > MAX_SELECTION_LENGTH) return;

      const paragraphText = findParagraphText(sel.anchorNode) || text;
      openSelection({
        kind: 'word',
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
      kind: 'word',
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
    showToast(`Saved "${word}" to your vocab`);
  }

  return (
    <>
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="font-serif text-lg leading-[1.8] text-foreground"
      >
        {paragraphs.map((para, pi) => {
          const block = parseBlock(para);
          const Tag = block.tag;

          return (
            <Tag key={pi} className={block.className}>
              {tokenizeParagraph(block.text).map((token, ti) => {
                if (token.trim() === '') return token;

                const word = stripWord(token);
                if (!word) return <span key={ti}>{token}</span>;

                const tokenId = `${pi}-${ti}`;
                const isActive = selection?.kind === 'word' && selection.tokenId === tokenId;
                const isSeen = savedWordSet.has(word.toLowerCase());
                const className = isActive
                  ? isSeen
                    ? 'word-seen-active'
                    : 'word-active'
                  : isSeen
                    ? 'word-seen'
                    : 'word';

                return (
                  <span
                    key={ti}
                    data-word={word}
                    data-token-id={tokenId}
                    title={isSeen ? "You've saved this word before" : undefined}
                    className={className}
                  >
                    {token}
                  </span>
                );
              })}
            </Tag>
          );
        })}
      </div>

      {selection?.kind === 'word' && (
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

      {selection?.kind === 'text' && (
        <TranslationPopup
          key={selection.id}
          text={selection.text}
          rect={selection.rect}
          onDismiss={handleDismiss}
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
