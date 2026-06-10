'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FlaskConical, RefreshCcw, Loader2, X } from 'lucide-react';

const ADMIN_EMAIL = 'admin.demo@nexlab.dz';
const TECH_EMAIL = 'tech.demo@nexlab.dz';
const DEMO_PASSWORD = 'DemoLab2026!';

export function DemoBanner() {
  const router = useRouter();
  const [loading, setLoading] = useState<'admin' | 'tech' | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const quickLogin = async (role: 'admin' | 'tech') => {
    setLoading(role);
    const email = role === 'admin' ? ADMIN_EMAIL : TECH_EMAIL;
    await signIn('credentials', { email, password: DEMO_PASSWORD, redirect: false });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="relative z-50 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <div className="flex items-center gap-2 min-w-0">
        <FlaskConical className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline font-semibold">Mode Démonstration</span>
        <span className="text-amber-800 hidden md:inline">—</span>
        <span className="text-amber-900 hidden md:inline">Les données sont réinitialisées chaque nuit.</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden lg:inline text-amber-800 text-xs">Connexion rapide :</span>

        <button
          id="demo-login-admin"
          onClick={() => quickLogin('admin')}
          disabled={!!loading}
          className="flex items-center gap-1.5 rounded-lg bg-amber-950/15 px-3 py-1 text-xs font-semibold hover:bg-amber-950/25 transition-colors disabled:opacity-60"
        >
          {loading === 'admin' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : null}
          Admin
        </button>

        <button
          id="demo-login-tech"
          onClick={() => quickLogin('tech')}
          disabled={!!loading}
          className="flex items-center gap-1.5 rounded-lg bg-amber-950/15 px-3 py-1 text-xs font-semibold hover:bg-amber-950/25 transition-colors disabled:opacity-60"
        >
          {loading === 'tech' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : null}
          Technicien
        </button>

        <div className="h-4 w-px bg-amber-700/40 hidden sm:block" />

        <button
          id="demo-banner-dismiss"
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 hover:bg-amber-950/15 transition-colors"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function DemoBannerWrapper() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  if (!isDemo) return null;
  return <DemoBanner />;
}
