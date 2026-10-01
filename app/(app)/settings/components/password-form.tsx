"use client";

import { useActionState, useState } from "react";
import { changePasswordAction, type ChangePasswordState } from "../../actions/settings";
import { Eye, EyeOff } from "lucide-react";
import { Field, SettingsCard } from "./settings-card";

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(async (prev, formData) => {
    const result = await changePasswordAction(prev, formData);
    // Collapse back to the button once the new password is stored.
    if (result?.ok) setOpen(false);
    return result;
  }, undefined);

  if (!hasPassword) {
    return <SettingsCard title="Password" desc="You sign in with Google, so there's no password to change." />;
  }

  if (!open) {
    return (
      <SettingsCard
        title="Password"
        desc={state?.ok ? "Password updated." : "Change the password you use to sign in."}
        footer={
          <button type="button" onClick={() => setOpen(true)} className="btn-secondary btn-sm">
            Change password
          </button>
        }
      />
    );
  }

  const errors = state?.fieldErrors;
  return (
    <form action={formAction}>
      <SettingsCard
        title="Password"
        desc="Change the password you use to sign in."
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} disabled={pending} className="btn-secondary btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="btn-primary btn-sm">
              {pending ? "Saving…" : "Update password"}
            </button>
          </>
        }
      >
        <Field label="Current password" error={errors?.currentPassword?.[0]}>
          <PasswordInput name="currentPassword" autoComplete="current-password" />
        </Field>
        <Field label="New password" hint="At least 8 characters." error={errors?.newPassword?.[0]}>
          <PasswordInput name="newPassword" autoComplete="new-password" minLength={8} />
        </Field>
        <Field label="Confirm new password" error={errors?.confirmPassword?.[0]}>
          <PasswordInput name="confirmPassword" autoComplete="new-password" />
        </Field>
      </SettingsCard>
    </form>
  );
}

// Same show/hide toggle as the sign-up form; each field toggles on its own.
function PasswordInput({
  name,
  autoComplete,
  minLength,
}: {
  name: string;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        name={name}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        className="input pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer p-1 text-text-tertiary hover:text-text-secondary"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <EyeOff size={16} strokeWidth={2} />
        ) : (
          <Eye size={16} strokeWidth={2} />
        )}
      </button>
    </div>
  );
}
