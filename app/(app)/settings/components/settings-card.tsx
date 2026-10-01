export function SettingsCard({
  title,
  desc,
  children,
  footer,
}: {
  title: string;
  desc?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mb-5 rounded-xl border border-border bg-white">
      <div className="px-[22px] py-5">
        <div className={`text-[15px] font-semibold ${desc ? "mb-1" : "mb-4"}`}>{title}</div>
        {desc && <div className={`text-[13px] text-text-secondary ${children ? "mb-4" : ""}`}>{desc}</div>}
        {children}
      </div>
      {footer && (
        <div className="flex justify-end gap-2 rounded-b-xl border-t border-border bg-bg-secondary px-[22px] py-3">
          {footer}
        </div>
      )}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-5 block last:mb-0">
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      {children}
      {error && <p className="error-text">{error}</p>}
      {hint && <span className="mt-1.5 block text-xs text-text-tertiary">{hint}</span>}
    </label>
  );
}
