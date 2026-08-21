import Link from 'next/link';

export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const isLg = size === 'lg';

  return (
    <Link
      href="/"
      className={`flex items-center gap-2 font-bold ${isLg ? 'text-lg' : 'text-base'}`}
    >
      <span
        className={`grid place-items-center rounded-lg bg-accent font-serif font-extrabold text-white ${
          isLg ? 'h-9 w-9 rounded-[10px] text-lg' : 'h-7 w-7 text-sm'
        }`}
      >
        R
      </span>
      <span>
        ReadEasy <span className="font-bold text-accent">AI</span>
      </span>
    </Link>
  );
}
