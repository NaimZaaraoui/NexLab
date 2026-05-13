'use client';

import { useState, useEffect } from 'react';
import { useLicense } from '@/components/providers/LicenseProvider';
import { ShieldCheck, ShieldAlert, Key, Copy, CheckCircle2, Server } from 'lucide-react';

export default function LicenseSettingsPage() {
  const { status, loading, refresh } = useLicense();
  const [licenseInput, setLicenseInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleCopy = () => {
    if (status?.machineId) {
      navigator.clipboard.writeText(status.machineId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApplyLicense = async () => {
    if (!licenseInput.trim()) return;
    
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/system/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: licenseInput.trim() })
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
        setLicenseInput('');
        await refresh();
      } else {
        setMessage({ type: 'error', text: data.message || data.error || 'Erreur lors de l\'activation.' });
        await refresh();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Une erreur est survenue lors de la communication avec le serveur.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-[var(--color-text-soft)]">Chargement des paramètres de licence...</div>;

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-text)]">Gestion de Licence</h1>
        <p className="text-[var(--color-text-secondary)] mt-1 text-sm font-medium">Activez et gérez votre abonnement à NexLab LIMS.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Machine ID Info */}
        <section className="rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Server size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">Serveur d&apos;Installation</h2>
              <p className="text-xs font-semibold text-[var(--color-text-soft)]">Identifiant unique de cette machine</p>
            </div>
          </div>

          <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
            Pour obtenir une clé d&apos;activation ou renouveler votre abonnement, veuillez transmettre cet identifiant à votre revendeur NexLab.
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-wider text-[var(--color-text-soft)]">Machine ID (Installation ID)</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-black text-[var(--color-text)] overflow-x-auto">
                {status?.machineId || 'Erreur de génération'}
              </code>
              <button 
                onClick={handleCopy}
                disabled={!status?.machineId}
                className="flex h-[46px] items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
              >
                {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
        </section>

        {/* License Status */}
        <section className="rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${status?.isValid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {status?.isValid ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text)]">Statut de la Licence</h2>
              <p className="text-xs font-semibold text-[var(--color-text-soft)]">Niveau d&apos;accès actuel</p>
            </div>
          </div>

          {status?.isValid ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
              <div className="flex items-center gap-2 text-emerald-700 mb-2">
                <CheckCircle2 size={18} />
                <span className="font-black">Licence Active</span>
              </div>
              <p className="text-sm font-medium text-emerald-800">
                L&apos;application est totalement déverrouillée et fonctionnelle.
              </p>
              {status.expiresAt && (
                <div className="mt-4 pt-4 border-t border-emerald-200/50">
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Expire le :</p>
                  <p className="text-lg font-black text-emerald-800 mt-0.5">
                    {new Date(status.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5">
              <div className="flex items-center gap-2 text-rose-700 mb-2">
                <ShieldAlert size={18} />
                <span className="font-black">Licence Expirée ou Non Trouvée</span>
              </div>
              <p className="text-sm font-medium text-rose-800">
                Mode lecture seule activé. La création d&apos;analyses et modifications critiques sont bloquées. Veuillez entrer une nouvelle clé ci-dessous.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Activation Panel */}
      <section className="rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Key size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--color-text)]">Activation (Hors-Ligne)</h2>
            <p className="text-xs font-semibold text-[var(--color-text-soft)]">Saisie de la clé secrète JWT</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {message && (
             <div className={`p-4 rounded-xl text-sm font-medium flex items-start gap-2 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
             }`}>
                {message.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <ShieldAlert size={16} className="mt-0.5 shrink-0" />}
                {message.text}
             </div>
          )}

          <textarea
            value={licenseInput}
            onChange={(e) => setLicenseInput(e.target.value)}
            placeholder="Collez ici le bloc de licence chiffré (JWT) fourni par votre revendeur..."
            className="w-full h-32 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm font-mono text-[var(--color-text)] placeholder:text-slate-400 focus:border-[var(--color-accent)] focus:bg-white outline-none resize-none break-all shadow-inner"
          />
          
          <div className="flex justify-end">
            <button
               onClick={handleApplyLicense}
               disabled={isSubmitting || !licenseInput.trim()}
               className="btn-primary h-10 px-8 text-sm gap-2"
            >
              {isSubmitting ? 'Vérification...' : 'Appliquer la Licence'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
