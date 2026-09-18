"use client";

import { useEffect, useRef, useState } from "react";
import { useFloating, offset, flip, shift } from "@floating-ui/react";
import { Copy, Check, X } from "lucide-react";
import type { TextTranslation } from "@/app/lib/llm/translate";

const GENERIC_TRANSLATE_ERROR = "Couldn't translate this. Try again.";

class TranslateError extends Error {}

export function TranslationPopup({
  text,
  rect,
  onDismiss,
}: {
  text: string;
  rect: DOMRect;
  onDismiss: () => void;
}) {
  const [translation, setTranslation] = useState<TextTranslation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const unmountedRef = useRef(false);
  // Caches the in-flight request so React Strict Mode's dev-only
  // mount→cleanup→mount effect cycle reuses it instead of firing a second
  // fetch (and burning a second quota call) for the same selection.
  const translatePromiseRef = useRef<Promise<void> | null>(null);

  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [offset(8), flip(), shift({ padding: 12 })],
  });

  useEffect(() => {
    refs.setPositionReference({ getBoundingClientRect: () => rect });
  }, [rect, refs]);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (translatePromiseRef.current) return;

    translatePromiseRef.current = fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new TranslateError(
            typeof body?.error === "string" ? body.error : undefined,
          );
        }
        return res.json() as Promise<TextTranslation>;
      })
      .then((data) => {
        if (!unmountedRef.current) setTranslation(data);
      })
      .catch((err) => {
        if (!unmountedRef.current) {
          setError(
            err instanceof TranslateError && err.message
              ? err.message
              : GENERIC_TRANSLATE_ERROR,
          );
        }
      })
      .finally(() => {
        if (!unmountedRef.current) setLoading(false);
      });
  }, [text]);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      const floating = refs.floating.current;
      if (floating && !floating.contains(e.target as Node)) {
        onDismiss();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onDismiss();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // refs.floating is a stable object identity from floating-ui and isn't reactive state,
    // so it's intentionally left out here (adding it trips the react-hooks/refs rule instead).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDismiss]);

  async function handleCopy() {
    if (!translation) return;
    await navigator.clipboard.writeText(translation.translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      // eslint-disable-next-line react-hooks/refs -- setFloating is floating-ui's callback ref for the positioned element, not a `.current` read
      ref={refs.setFloating}
      style={floatingStyles}
      className="z-[60] w-80 overflow-hidden rounded-xl border border-border bg-white shadow-lg"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="text-[11px] font-semibold tracking-[0.06em] text-text-tertiary uppercase">
          Translation
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-text-tertiary transition-colors hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <div className="border-b border-border px-4 py-3 text-[13px] leading-normal">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3.5 w-full animate-pulse rounded bg-bg-tertiary" />
            <div className="h-3.5 w-4/5 animate-pulse rounded bg-bg-tertiary" />
          </div>
        ) : error ? (
          <div className="text-danger">{error}</div>
        ) : !translation ? (
          <div className="text-danger">{GENERIC_TRANSLATE_ERROR}</div>
        ) : (
          <>
            <div className="mb-2 font-medium text-foreground">
              {translation.translation}
            </div>
            {translation.note && (
              <div className="text-text-secondary italic">
                {translation.note}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex gap-2 bg-bg-secondary px-3 py-2.5">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!translation}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-bg-tertiary disabled:text-text-tertiary"
        >
          {copied ? (
            <>
              <Check size={14} /> Copied
            </>
          ) : (
            <>
              <Copy size={14} /> Copy
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-strong px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-bg-tertiary"
        >
          <X size={14} /> Dismiss
        </button>
      </div>
    </div>
  );
}
