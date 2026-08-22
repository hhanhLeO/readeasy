const CEFR_STYLES: Record<string, string> = {
  A1: 'bg-[#F1F5F9] text-[#64748B]',
  A2: 'bg-[#EFF6FF] text-[#3B82F6]',
  B1: 'bg-accent-tint text-accent',
  B2: 'bg-[#EEF2FF] text-[#6366F1]',
  C1: 'bg-[#F5F3FF] text-[#7C3AED]',
  C2: 'bg-[#1E293B] text-[#F8FAFC]',
};

export function CEFRBadge({
  level,
  className = '',
}: {
  level: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] leading-[1.5] font-semibold tracking-[0.02em] ${CEFR_STYLES[level] ?? ''} ${className}`}
    >
      {level}
    </span>
  );
}
