'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FlaskConical, Loader2 } from 'lucide-react';

const ACCOUNTS = [
  { label: 'Admin',      role: 'admin', email: 'admin.demo@nexlab.dz' },
  { label: 'Technicien', role: 'tech',  email: 'tech.demo@nexlab.dz'  },
] as const;

const DEMO_PASSWORD = 'DemoLab2026!';

export function DemoBanner() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const quickLogin = async (email: string, role: string) => {
    setLoading(role);
    await signIn('credentials', { email, password: DEMO_PASSWORD, redirect: false });
    router.push('/');
    router.refresh();
    setLoading(null);
  };

  return (
    <div className="sticky top-0 z-[100] flex w-full items-center justify-center gap-3 bg-indigo-600 px-4 py-3 text-white shadow-md animate-fade-in print:hidden">
      <FlaskConical size={18} className="shrink-0 text-indigo-200" />
      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
        <p className="text-sm font-bold tracking-wide">
          Mode Démonstration — données fictives réinitialisées chaque nuit.
        </p>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-xs text-indigo-200">Connexion rapide :</span>
          {ACCOUNTS.map(({ label, role, email }) => (
            <button
              key={role}
              id={`demo-login-${role}`}
              onClick={() => quickLogin(email, role)}
              disabled={!!loading}
              className="inline-flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1 text-xs font-bold hover:bg-white/25 transition-colors disabled:opacity-60"
            >
              {loading === role && <Loader2 className="h-3 w-3 animate-spin" />}
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DemoBannerWrapper() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null;
  return <DemoBanner />;
}
