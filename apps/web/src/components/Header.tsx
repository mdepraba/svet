import { LogOut } from 'lucide-react';

import { initials } from '@/lib/format';
import { useAuth } from '@/lib/auth/useAuth';
import { Clock } from './clock';
import { DynamicBreadcrumb } from './DynamicBreadcrumb';
import ThemeToggle from './ThemeToggle';
import { SidebarTrigger } from './ui/sidebar';

export default function Header() {
  return (
    <header className="border-border bg-background sticky top-0 z-50 flex h-[54px] flex-none items-center gap-3 border-b px-4">
      <SidebarTrigger className="text-foreground/65 hover:text-foreground hover:bg-accent -ml-1 p-1.5 transition-colors" />

      <div className="bg-border h-4 w-px" />

      <DynamicBreadcrumb />

      <div className="ml-auto flex items-center gap-3.5">
        <Clock />
        <Account />
        <ThemeToggle />
      </div>
    </header>
  );
}

/**
 * The signed-in user's initials, and the way out. Circular — the one round
 * shape the Industry system keeps, and the design board draws it that way too.
 *
 * `useAuth` reads from the session store, which reports nobody during the
 * server render and the real user once hydrated, so this never trips hydration.
 */
function Account() {
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <div className="flex items-center gap-2">
      <div
        className="bg-brand-200 text-brand-800 grid size-7 flex-none place-items-center rounded-full text-[11px] font-medium"
        title={user ? `${user.name} · ${user.roleName}` : 'Not signed in'}
      >
        {user ? initials(user.name) : '—'}
      </div>

      {isAuthenticated && (
        <button
          type="button"
          title="Sign out"
          aria-label="Sign out"
          className="text-foreground/65 hover:text-foreground hover:bg-accent p-1.5 transition-colors"
          onClick={() => void signOut()}
        >
          <LogOut className="size-4" />
        </button>
      )}
    </div>
  );
}
