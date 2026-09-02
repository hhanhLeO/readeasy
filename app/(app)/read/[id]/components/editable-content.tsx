'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { ReadingView } from './reading-view';
import { updateDocumentContentAction } from '@/app/(app)/actions/documents';

function toParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function EditableContent({
  documentId,
  initialContent,
  savedWords,
}: {
  documentId: string;
  initialContent: string;
  savedWords: string[];
}) {
  const [content, setContent] = useState(initialContent);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  function startEdit() {
    setDraft(content);
    setError(null);
    setEditing(true);
    setSaved(false);
  }

  async function commit() {
    const next = draft.trim();
    if (!next) {
      setError('Content cannot be empty.');
      return;
    }
    if (next === content) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const savedContent = await updateDocumentContentAction(documentId, next);
      setContent(savedContent);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Couldn't save your changes. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div>
        <textarea
          ref={textareaRef}
          rows={20}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-full resize-y rounded-[10px] border border-accent bg-white p-4 font-serif text-lg leading-[1.8] text-foreground outline-none shadow-[0_0_0_3px_var(--accent-tint)]"
        />
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={commit}
            disabled={saving}
            className="rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-bg-tertiary disabled:text-text-tertiary"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="rounded-lg border border-border-strong px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-bg-tertiary disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <span className="text-xs text-text-tertiary">
            Use #/## for headings · Esc to cancel
          </span>
        </div>
        {error && <div className="mt-2 text-[13px] text-danger">{error}</div>}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={startEdit}
          aria-label="Edit content"
          title="Edit content"
          className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2 py-1 text-[13px] font-medium text-text-tertiary transition-colors hover:border-border hover:bg-accent-tint hover:text-accent-dark"
        >
          <Pencil size={13} /> Edit content
        </button>
      </div>
      <ReadingView
        documentId={documentId}
        paragraphs={toParagraphs(content)}
        savedWords={savedWords}
      />
      {saved && (
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-success">
          <Check size={13} /> Saved
        </div>
      )}
    </div>
  );
}
