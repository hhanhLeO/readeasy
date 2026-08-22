'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary btn-lg mt-2 w-full"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
