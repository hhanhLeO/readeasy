'use client';

import { useRef, useState, useMemo, Fragment, isValidElement, cloneElement } from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check } from 'lucide-react';
import { WordPanel } from './word-panel';
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

function tokenizeText(text: string): string[] {
  return text.split(/(\s+)/);
}

function findSentence(paragraphText: string, selected: string): string {
  const sentences = paragraphText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.find((s) => s.includes(selected)) ?? paragraphText;
}

// Block-level tags word/phrase lookup treats as "one unit of context" — kept
// in sync with the tags the markdown renderer below can produce text inside.
const BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH']);

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

// Markdown heading levels 1-6 render one HTML level lower (h1 -> h2, ...,
// h6 stays h6) so `h1` stays reserved for the document title above the
// reading view.
const HEADING_TAGS = ['h2', 'h3', 'h4', 'h5', 'h6', 'h6'] as const;
const HEADING_CLASSES = [
  'mt-8 mb-3 text-pretty font-serif text-2xl font-bold text-foreground',
  'mt-7 mb-3 text-pretty font-serif text-xl font-bold text-foreground',
  'mt-6 mb-2.5 text-pretty font-serif text-lg font-semibold text-foreground',
  'mt-6 mb-2.5 text-pretty font-serif text-base font-semibold text-foreground',
  'mt-6 mb-2.5 text-pretty font-serif text-base font-semibold text-foreground',
  'mt-6 mb-2.5 text-pretty font-serif text-base font-semibold text-foreground',
];

// Inline markdown elements whose contained words still get wrapped for
// lookup (bold/italic/links inside a paragraph, list item, or table cell).
const INLINE_FORMATTING_TAGS = new Set(['strong', 'em', 'del', 'a', 'sup', 'sub']);

// Code (inline or fenced) is never tokenized for lookup — it's code, not vocabulary
function InlineCode({ children }: { children?: ReactNode }) {
  return (
    <code className="rounded bg-bg-tertiary px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">
      {children}
    </code>
  );
}

export function ReadingView({
  documentId,
  content,
  savedWords,
}: {
  documentId: string;
  content: string;
  savedWords: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nextSelectionId = useRef(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const savedWordSet = useMemo(() => new Set(savedWords), [savedWords]);

  function tokenizeInline(node: ReactNode, blockId: number, counter: { current: number }): ReactNode {
    if (node === null || node === undefined || typeof node === 'boolean') return node;

    if (typeof node === 'string') {
      return tokenizeText(node).map((token) => {
        if (token.trim() === '') return token;

        const word = stripWord(token);
        const ti = counter.current++;
        if (!word) return <span key={ti}>{token}</span>;

        const tokenId = `${blockId}-${ti}`;
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
      });
    }

    if (Array.isArray(node)) {
      return node.map((child, i) => (
        <Fragment key={i}>{tokenizeInline(child, blockId, counter)}</Fragment>
      ));
    }

    if (isValidElement<{ children?: ReactNode }>(node) && typeof node.type === 'string' && INLINE_FORMATTING_TAGS.has(node.type)) {
      return cloneElement(node, undefined, tokenizeInline(node.props.children, blockId, counter));
    }

    return node;
  }

  function textBlock(tag: keyof React.JSX.IntrinsicElements, className: string) {
    return function Block({
      children,
      node,
    }: {
      children?: ReactNode;
      node?: { position?: { start: { offset?: number } } };
    }) {
      const id = node?.position?.start.offset ?? 0;
      const counter = { current: 0 };
      const Tag = tag;
      return <Tag className={className}>{tokenizeInline(children, id, counter)}</Tag>;
    };
  }

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

  // Words are wrapped in a lookup span even inside links (a saved word can
  // legitimately be part of a link's text); without this, clicking one to
  // look it up would also follow the link away from the reading view.
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest('[data-word]') && target.closest('a')) {
      e.preventDefault();
    }
  }

  function handleDismiss() {
    window.getSelection()?.removeAllRanges();
    setSelection(null);
  }

  function handleSaved(word: string) {
    showToast(`Saved "${word}" to your vocab`);
  }

  const components = {
    p: textBlock('p', 'mb-5 text-pretty'),
    li: textBlock('li', 'pl-1'),
    td: textBlock('td', 'border-b border-border px-3.5 py-2.5'),
    th: textBlock(
      'th',
      'whitespace-nowrap border-b border-border bg-bg-secondary px-3.5 py-2.5 text-left text-[12.5px] font-semibold text-text-secondary',
    ),
    h1: textBlock(HEADING_TAGS[0], HEADING_CLASSES[0]),
    h2: textBlock(HEADING_TAGS[1], HEADING_CLASSES[1]),
    h3: textBlock(HEADING_TAGS[2], HEADING_CLASSES[2]),
    h4: textBlock(HEADING_TAGS[3], HEADING_CLASSES[3]),
    h5: textBlock(HEADING_TAGS[4], HEADING_CLASSES[4]),
    h6: textBlock(HEADING_TAGS[5], HEADING_CLASSES[5]),
    ul: ({ children }: { children?: ReactNode }) => (
      <ul className="mb-6 flex list-disc flex-col gap-[9px] pl-[26px] marker:font-semibold marker:text-text-tertiary">
        {children}
      </ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol className="mb-6 flex list-decimal flex-col gap-[9px] pl-[26px] marker:font-semibold marker:text-text-tertiary">
        {children}
      </ol>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="my-8 border-l-[3px] border-accent py-1 pl-5 font-serif text-[19px] leading-[1.6] text-foreground italic">
        {children}
      </blockquote>
    ),
    img: ({ src, alt }: { src?: string | Blob; alt?: string }) => (
      <span className="my-8 block">
        <img
          src={typeof src === 'string' ? src : undefined}
          alt={alt ?? ''}
          className="w-full rounded-[10px] border border-border"
        />
        {alt && (
          <span className="mt-2.5 block text-[12.5px] leading-normal text-text-secondary not-italic">
            {alt}
          </span>
        )}
      </span>
    ),
    hr: () => <hr className="my-10 border-border" />,
    code: InlineCode,
    pre: ({ children }: { children?: ReactNode }) => {
      const codeEl = Array.isArray(children) ? children[0] : children;
      if (!isValidElement<{ className?: string; children?: ReactNode }>(codeEl)) {
        return <pre className="overflow-x-auto px-4 py-3.5">{children}</pre>;
      }
      const lang = /language-(\S+)/.exec(codeEl.props.className ?? '')?.[1] ?? 'text';
      return (
        <div className="my-7 overflow-hidden rounded-[10px] border border-border bg-bg-secondary">
          <div className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-2 font-mono text-[11px] tracking-wide text-text-secondary uppercase">
            <span>{lang}</span>
            <span className="font-sans text-text-tertiary normal-case tracking-normal">
              Not analyzed for vocabulary
            </span>
          </div>
          <pre className="overflow-x-auto px-4 py-3.5">
            <code className="font-mono text-[12.5px] leading-[1.65] whitespace-pre text-foreground">
              {codeEl.props.children}
            </code>
          </pre>
        </div>
      );
    },
    table: ({ children }: { children?: ReactNode }) => (
      <div className="my-7 overflow-x-auto rounded-[10px] border border-border">
        <table className="w-full border-collapse text-[13.5px]">{children}</table>
      </div>
    ),
    tbody: ({ children }: { children?: ReactNode }) => (
      <tbody className="[&>tr:last-child>td]:border-b-0">{children}</tbody>
    ),
  };

  return (
    <>
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        className="font-serif text-lg leading-[1.8] text-foreground"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} >
          {content}
        </ReactMarkdown>
      </div>

      {selection?.kind === 'word' && (
        <WordPanel
          selectionId={selection.id}
          word={selection.word}
          sentence={selection.sentence}
          documentId={documentId}
          onClose={handleDismiss}
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
