'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Lock, LogOut, User, Shield } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/core/constants';

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  role?: string;
  show: boolean;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onLogoutRequest: () => void;
}

export function UserMenu({
  name,
  email,
  role = 'TECHNICIEN',
  show,
  menuRef,
  onToggle,
  onLogoutRequest,
}: UserMenuProps) {
  const router = useRouter();
  const roleLabel = ROLE_LABELS[role] || role;
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-violet-100 text-violet-700 border-violet-200/60',
    TECHNICIEN: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-blue-200/60',
    RECEPTIONNISTE: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    MEDECIN: 'bg-amber-50 text-amber-700 border-amber-200/60',
  };
  const roleBadge = roleColors[role] || roleColors.TECHNICIEN;

  return (
    <div className="relative" ref={menuRef}>
      <button
        id="user-menu-trigger"
        onClick={onToggle}
        className="group flex items-center gap-2.5 rounded-2xl border bg-[var(--color-surface)] px-2.5 py-1.5 transition-all hover:bg-[var(--color-surface-muted)] hover:shadow-sm active:scale-[0.98]"
      >
        <div className="hidden text-right sm:flex sm:flex-col">
          <div className="text-xs font-semibold text-[var(--color-text)]">{name || 'Utilisateur'}</div>
          <div className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-secondary)]">{roleLabel}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-700/20 bg-[var(--color-accent)] text-xs font-black text-white transition-all group-hover:brightness-105">
          {initials}
        </div>
      </button>

      {show && (
        <div
          id="user-menu-panel"
          className="absolute right-0 top-full z-50 mt-2 w-64 animate-[fade-in_120ms_ease-out] rounded-2xl border bg-[var(--color-surface)] shadow-[0_12px_28px_rgba(15,31,51,0.10)] overflow-hidden"
        >
          {/* User identity header */}
          <div className="flex items-center gap-3 border-b px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent)] text-sm font-black text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--color-text)]">{name || 'Utilisateur'}</div>
              <div className="truncate text-xs text-[var(--color-text-secondary)]">{email || ''}</div>
              <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${roleBadge}`}>
                <Shield className="h-2.5 w-2.5" />
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1.5">
            <button
              id="user-menu-change-password"
              onClick={() => {
                onToggle();
                router.push('/changer-mot-de-passe');
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
                <Lock className="h-3.5 w-3.5" />
              </span>
              Changer le mot de passe
            </button>
          </div>

          {/* Divider + logout */}
          <div className="border-t py-1.5">
            <button
              id="user-menu-logout"
              onClick={() => {
                onToggle();
                onLogoutRequest();
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40">
                <LogOut className="h-3.5 w-3.5 text-rose-500" />
              </span>
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
