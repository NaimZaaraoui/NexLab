'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ShieldCheck, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { NexLabLockup } from '@/components/branding/NexLabLockup';


export default function ChangePasswordPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Une erreur s'est produite.");
      }

      // Synchronize the session token to remove the mustChangePassword flag
      await updateSession({
        mustChangePassword: false
      });

      router.push('/');
      router.refresh();

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
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
            "Sécurité avant<br />tout."
          </blockquote>
          <div className="space-y-4">
            {[
              { stat: '100%', label: 'Chiffrement local des données' },
              { stat: '24/7', label: 'Protection d\'accès stricte' },
              { stat: '0', label: 'Dépendance Cloud externe' },
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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Sécurité de votre compte</h1>
            <p className="mt-1 text-sm text-slate-500">Vous devez définir un nouveau mot de passe personnalisé pour continuer.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nouveau mot de passe */}
            <div>
              <label htmlFor="new-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            {/* Confirmer le mot de passe */}
            <div>
              <label htmlFor="confirm-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`${inputCls} pr-11`}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <p className="text-sm font-medium text-rose-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Mise à jour...</>
              ) : (
                'Enregistrer le mot de passe'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Mise à jour obligatoire de sécurité
          </div>
        </div>
      </div>
    </div>
  );
}
