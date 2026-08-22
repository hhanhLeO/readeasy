import { Logo } from '@/app/components/logo';

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function Navbar({ user }: { user: { username: string } }) {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-white px-6">
      <Logo />
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-tint px-2.5 py-1.5 text-[13px] font-semibold text-accent-dark">
          🔥 8 days
        </span>
        <span
          className="grid h-8 w-8 place-items-center rounded-full bg-[linear-gradient(135deg,#0D9488,#6366F1)] text-[13px] font-semibold text-white"
          title={user.username}
        >
          {initials(user.username)}
        </span>
      </div>
    </header>
  );
}
