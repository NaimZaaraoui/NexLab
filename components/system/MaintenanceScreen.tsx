import Link from 'next/link';
import { ShieldAlert, Wrench } from 'lucide-react';

export function MaintenanceScreen({
  message,
  isAdmin = false,
}: {
  message?: string;
  isAdmin?: boolean;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-page)] px-4 py-10">
      <div className="w-full max-w-2xl rounded-[2rem] border bg-[var(--color-surface)] p-8 shadow-[0_20px_60px_rgba(15,31,51,0.08)]">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            {isAdmin ? <Wrench className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">
                Maintenance systeme
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">
                {isAdmin ? 'Mode maintenance actif' : 'Application temporairement indisponible'}
              </h1>
            </div>
            <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
              {message?.trim() ||
                'Une intervention de maintenance est en cours. Merci de patienter quelques instants avant de revenir.'}
            </p>
            {isAdmin ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Vous etes connecte en tant qu&apos;administrateur, donc l&apos;acces reste autorise pour piloter la maintenance.
              </p>
            ) : (
              <Link href="/login" className="btn-secondary inline-flex">
                Revenir plus tard
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
