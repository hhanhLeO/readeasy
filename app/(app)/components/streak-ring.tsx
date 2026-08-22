const CIRCUMFERENCE = 150.8;

export function StreakRing({ days }: { days: number }) {
  const progress = ((days % 7) / 7) * CIRCUMFERENCE;

  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth="4"
        />
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeDasharray={`${progress} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        <div>
          <div className="text-sm font-bold text-accent-dark">{days}</div>
          <div className="text-[9px] text-text-secondary">day</div>
        </div>
      </div>
    </div>
  );
}
