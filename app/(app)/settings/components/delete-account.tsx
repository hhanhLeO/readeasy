"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction } from "../../actions/settings";

export function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-danger bg-white px-[22px] py-5">
      <div className="flex items-center justify-between gap-5">
        <div>
          <div className="mb-1 text-[15px] font-semibold">Delete account</div>
          <div className="text-[13px] text-text-secondary">
            {confirming
              ? "Are you sure? All your articles, saved words, and review history will be deleted."
              : "Removes your saved words, history, and progress. This cannot be undone."}
          </div>
        </div>
        {confirming ? (
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setConfirming(false)} disabled={pending} className="btn-secondary btn-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => startTransition(() => deleteAccountAction())}
              disabled={pending}
              className="btn-danger-solid btn-sm"
            >
              {pending ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="btn-danger btn-sm shrink-0">
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
