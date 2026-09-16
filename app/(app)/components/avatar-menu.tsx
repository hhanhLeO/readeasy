'use client';

import { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { logout } from '@/app/(auth)/actions';

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function AvatarMenu({
  user,
}: {
  user: { username: string; email: string };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative flex" ref={ref}>
      <button
        type="button"
        title="Profile & settings"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-[linear-gradient(135deg,#0D9488,#6366F1)] text-[13px] font-semibold text-white transition-shadow ${
          open ? 'shadow-[0_0_0_2px_var(--color-accent-tint)]' : ''
        }`}
      >
        {initials(user.username)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+8px)] right-0 z-60 min-w-[216px] rounded-xl border border-border bg-white p-1.5 shadow-lg"
        >
          <div className="mb-1.5 border-b border-border px-2.5 pt-2.5 pb-3">
            <div className="text-[13.5px] font-semibold">{user.username}</div>
            <div className="mt-0.5 text-xs text-text-tertiary">
              {user.email}
            </div>
          </div>

          {/* Profile & settings — profile page not built yet, uncomment when it lands
          <button
            type="button"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-[13.5px] font-medium text-foreground transition-colors hover:bg-bg-secondary"
          >
            <User size={15} />
            Profile & settings
          </button>
          */}

          <form action={logout}>
            <button
              type="submit"
              role="menuitem"
              className="mt-1 flex w-full cursor-pointer items-center gap-2.5 rounded-b-lg rounded-t-none border-t border-border px-2.5 pt-2.5 pb-2.5 text-left text-[13.5px] font-medium text-danger transition-colors hover:bg-danger/10"
            >
              <LogOut size={15} />
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
