import { Logo } from '@/app/components/logo';
import { AvatarMenu } from './avatar-menu';

export function Navbar({
  user,
}: {
  user: { username: string; email: string };
}) {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b border-border bg-white px-6">
      <Logo />
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        {/* <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-tint px-2.5 py-1.5 text-[13px] font-semibold text-accent-dark">
          🔥 8 days
        </span> */}
        <AvatarMenu user={user} />
      </div>
    </header>
  );
}
