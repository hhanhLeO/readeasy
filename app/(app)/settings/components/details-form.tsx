"use client";

import { useActionState, useState } from "react";
import { updateProfileAction, type UpdateProfileState } from "../../actions/settings";
import { Field, SettingsCard } from "./settings-card";

export function DetailsForm({ username, email }: { username: string; email: string }) {
  const [name, setName] = useState(username);
  const [showSaved, setShowSaved] = useState(false);
  const [state, formAction, pending] = useActionState<UpdateProfileState, FormData>(async (prev, formData) => {
    const result = await updateProfileAction(prev, formData);
    // Flash "Changes saved" for a moment after each successful save.
    if (result?.ok) {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 1800);
    }
    return result;
  }, undefined);

  const savedName = state?.username ?? username;
  const dirty = name.trim() !== savedName;

  return (
    <form action={formAction}>
      <SettingsCard
        title="Your details"
        footer={
          <>
            {showSaved && (
              <span className="mr-auto self-center text-[12.5px] text-accent-dark">Changes saved</span>
            )}
            <button type="button" onClick={() => setName(savedName)} disabled={!dirty || pending} className="btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={!dirty || pending} className="btn-primary btn-sm">
              {pending ? "Saving…" : "Save changes"}
            </button>
          </>
        }
      >
        <Field label="Display name" error={state?.fieldErrors?.username?.[0]}>
          <input name="username" value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>
        <Field label="Email" hint="Used to sign in. It can't be changed yet.">
          <input value={email} readOnly className="input text-text-secondary" />
        </Field>
      </SettingsCard>
    </form>
  );
}
