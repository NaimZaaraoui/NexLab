'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MailIcon, Lock, Loader2, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { NexLabLockup } from '@/components/branding/NexLabLockup';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetch('/api/setup/status')
      .then((res) => res.json())
      .then((data) => {
        if (!data.initialized) {
          router.replace('/setup/wizard');
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError(result.error === 'Compte désactivé'
          ? "Ce compte a été désactivé. Contactez l'administrateur."
          : 'Email ou mot de passe incorrect.');
        setLoading(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError("Une erreur s'est produite lors de la connexion.");
      setLoading(false);
    }
  };

  const inputCls = 'h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-gradient-to-b from-indigo-700 via-indigo-600 to-indigo-900 p-10 relative overflow-hidden shrink-0">
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-10 -right-20 h-60 w-60 rounded-full bg-indigo-300/20 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <NexLabLockup variant="light" size="md" />
        </div>

        {/* Quote / value props */}
        <div className="relative z-10 space-y-8">
          <blockquote className="text-3xl font-bold leading-tight text-white">
            "Chaque résultat<br />compte."
          </blockquote>
          <div className="space-y-4">
            {[
              { stat: '55+', label: 'Tests préconfigurés' },
              { stat: '100%', label: 'Données locales — aucun Cloud' },
              { stat: '24/7', label: 'Traçabilité des résultats' },
            ].map(({ stat, label }) => (
              <div key={label} className="flex items-center gap-4">
                <span className="w-14 shrink-0 text-xl font-black text-white">{stat}</span>
                <span className="text-sm text-indigo-100">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-indigo-200/60">
          © {new Date().getFullYear()} NexLab — Tous droits réservés
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f8fafc] p-6 lg:p-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <NexLabLockup size="sm" variant="dark" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Bon retour</h1>
            <p className="mt-1 text-sm text-slate-500">Connectez-vous à votre espace laboratoire.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Adresse email
              </label>
              <div className="relative">
                <MailIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@laboratoire.com"
                  required
                  autoFocus
                  className={inputCls}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <ShieldCheck className="h-4 w-4 shrink-0 text-rose-500" />
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Vérification…</>
              ) : (
                <>Connexion<ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Connexion chiffrée de bout en bout
          </div>
        </div>
      </div>
    </div>
  );
}
