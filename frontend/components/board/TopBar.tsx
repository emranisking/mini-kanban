'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../auth/AuthProvider';
import { Avatar } from '../ui/Avatar';

export function TopBar({ children }: { children?: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <header className="acrylic sticky top-0 z-30 flex h-14 items-center justify-between px-5">
      <div className="flex items-center gap-4">
        <Link href="/boards" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-accent-gradient text-xs font-bold text-white">
            K
          </div>
          <span className="text-sm font-semibold tracking-tight text-ink-primary">Mini Kanban</span>
        </Link>
        {children}
      </div>

      {user && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-sm p-1 transition-colors hover:bg-white/5"
          >
            <Avatar name={user.name} size={30} />
          </button>
          {menuOpen && (
            <div className="acrylic absolute right-0 top-11 w-56 animate-rise-in rounded-md bg-surface-overlay/95 p-1.5 shadow-depth-16">
              <div className="border-b border-border-subtle px-3 py-2">
                <p className="truncate text-sm font-medium text-ink-primary">{user.name}</p>
                <p className="truncate text-xs text-ink-tertiary">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="mt-1 flex w-full items-center rounded-sm px-3 py-2 text-left text-sm text-ink-secondary transition-colors hover:bg-white/5 hover:text-ink-primary"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
