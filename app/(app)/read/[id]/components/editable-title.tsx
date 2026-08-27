'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import { updateDocumentTitleAction } from '@/app/(app)/actions/documents';

export function EditableTitle({
  documentId,
  initialTitle,
}: {
  documentId: string;
  initialTitle: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [editing]);

  function startEdit() {
    setDraft(title);
    setEditing(true);
    setSaved(false);
  }

  async function commit() {
    const next = draft.trim();
    if (!next || next === title) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const savedTitle = await updateDocumentTitleAction(documentId, next);
      setTitle(savedTitle);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="group/title mb-8">
      {editing ? (
        <div>
          <textarea
            ref={textareaRef}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
              if (e.key === 'Escape') setEditing(false);
            }}
            className="headline w-full resize-none rounded-[10px] border border-accent bg-white px-3 py-2 outline-none shadow-[0_0_0_3px_var(--accent-tint)]"
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
              Enter to save · Esc to cancel
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <h1 className="headline min-w-0 flex-1">{title}</h1>
          <button
            type="button"
            onClick={startEdit}
            aria-label="Edit title"
            title="Edit title"
            className="mt-2 flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg border border-transparent text-text-tertiary opacity-0 transition-all group-hover/title:opacity-100 hover:border-border hover:bg-accent-tint hover:text-accent-dark focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            <Pencil size={15} />
          </button>
        </div>
      )}
      {saved && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-success">
          <Check size={13} /> Saved
        </span>
      )}
    </div>
  );
}
