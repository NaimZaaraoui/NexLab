'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FlaskConical, Building2, UserCog, Database, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, Eye, EyeOff,
} from 'lucide-react';

type Step = 'welcome' | 'lab' | 'admin' | 'demo' | 'complete';
interface LabData {
  labName: string; labSubtitle: string; labParent: string;
  labAddress1: string; labAddress2: string;
  labPhone: string; labEmail: string;
  labBioName: string; labBioTitle: string;
}
interface AdminData {
  name: string; email: string; password: string; confirmPassword: string;
}

const STEPS: { id: Step; title: string; Icon: React.ElementType }[] = [
  { id: 'welcome', title: 'Bienvenue', Icon: FlaskConical },
  { id: 'lab', title: 'Laboratoire', Icon: Building2 },
  { id: 'admin', title: 'Administrateur', Icon: UserCog },
  { id: 'demo', title: 'Données', Icon: Database },
  { id: 'complete', title: 'Terminé', Icon: CheckCircle2 },
];

const Field = ({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">
      {label}{required && <span className="ml-1 text-rose-400">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100';

export default function WizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [labData, setLabData] = useState<LabData>({
    labName: '', labSubtitle: 'Service de Laboratoire', labParent: '',
    labAddress1: '', labAddress2: '', labPhone: '', labEmail: '',
    labBioName: '', labBioTitle: 'Docteur',
  });
  const [adminData, setAdminData] = useState<AdminData>({
    name: '', email: '', password: '', confirmPassword: '',
  });
  const [includeDemo, setIncludeDemo] = useState(true);

  useEffect(() => {
    const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
    if (isPreview && process.env.NODE_ENV !== 'production') {
      setChecking(false);
      return;
    }
    fetch('/api/setup').then(r => r.json()).then(d => {
      if (d.setupDone) router.replace('/login');
    }).catch(() => {}).finally(() => setChecking(false));
  }, [router]);

  const stepIndex = STEPS.findIndex(s => s.id === currentStep);

  async function handleNext() {
    setError('');
    if (currentStep === 'welcome') return setCurrentStep('lab');
    if (currentStep === 'lab') {
      if (!labData.labName.trim()) return setError('Le nom du laboratoire est requis.');
      return setCurrentStep('admin');
    }
    if (currentStep === 'admin') {
      if (!adminData.name.trim() || !adminData.email.trim() || !adminData.password.trim())
        return setError('Tous les champs marqués * sont requis.');
      if (adminData.password.length < 6)
        return setError('Le mot de passe doit contenir au moins 6 caractères.');
      if (adminData.password !== adminData.confirmPassword)
        return setError('Les mots de passe ne correspondent pas.');
      return setCurrentStep('demo');
    }
    if (currentStep === 'demo') {
      setLoading(true);
      try {
        const res = await fetch('/api/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...labData,
            adminName: adminData.name, adminEmail: adminData.email,
            adminPassword: adminData.password, includeDemo,
          }),
        });
        const data = await res.json();
        if (!res.ok) return setError(data.error || 'Erreur lors de la configuration.');
        setCurrentStep('complete');
      } catch {
        setError('Erreur réseau. Vérifiez votre connexion.');
      } finally {
        setLoading(false);
      }
    }
  }

  function handleBack() {
    if (stepIndex > 0) { setCurrentStep(STEPS[stepIndex - 1].id); setError(''); }
  }

  if (checking) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, idx) => {
          const past = idx < stepIndex;
          const active = idx === stepIndex;
          return (
            <div key={step.id} className="flex flex-1 items-center gap-1">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                past ? 'bg-indigo-600 text-white' :
                active ? 'border-2 border-indigo-600 bg-white text-indigo-600' :
                'border-2 border-slate-200 bg-white text-slate-500'
              }`}>
                {past ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 rounded transition-all ${idx < stepIndex ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

        {/* STEP: Welcome */}
        {currentStep === 'welcome' && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
              <FlaskConical className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Configuration de NexLab</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Ce guide va vous aider à configurer votre laboratoire en quelques étapes simples. Comptez environ 3 minutes.
            </p>
            <div className="mt-6 space-y-2.5 text-left">
              {[
                { Icon: Building2, label: 'Informations du laboratoire' },
                { Icon: UserCog, label: 'Compte administrateur principal' },
                { Icon: Database, label: 'Catalogue de tests (optionnel)' },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <Icon className="h-4 w-4 shrink-0 text-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Lab */}
        {currentStep === 'lab' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Informations du Laboratoire</h2>
            <Field label="Nom du laboratoire" required>
              <input autoFocus className={inputCls} type="text" placeholder="ex : CSSB Gallel" value={labData.labName} onChange={e => setLabData({ ...labData, labName: e.target.value })} />
            </Field>
            <Field label="Sous-titre">
              <input className={inputCls} type="text" placeholder="Service de Laboratoire" value={labData.labSubtitle} onChange={e => setLabData({ ...labData, labSubtitle: e.target.value })} />
            </Field>
            <Field label="Structure parente / Hôpital">
              <input className={inputCls} type="text" placeholder="ex : Hôpital Menzel Bouzaïene" value={labData.labParent} onChange={e => setLabData({ ...labData, labParent: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Adresse">
                <input className={inputCls} type="text" placeholder="Rue, Quartier" value={labData.labAddress1} onChange={e => setLabData({ ...labData, labAddress1: e.target.value })} />
              </Field>
              <Field label="Ville / Gouvernorat">
                <input className={inputCls} type="text" placeholder="Sfax, Tunis…" value={labData.labAddress2} onChange={e => setLabData({ ...labData, labAddress2: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Téléphone">
                <input className={inputCls} type="tel" placeholder="+216 XX XXX XXX" value={labData.labPhone} onChange={e => setLabData({ ...labData, labPhone: e.target.value })} />
              </Field>
              <Field label="Email">
                <input className={inputCls} type="email" placeholder="lab@example.com" value={labData.labEmail} onChange={e => setLabData({ ...labData, labEmail: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Biologiste responsable">
                <input className={inputCls} type="text" placeholder="Prénom NOM" value={labData.labBioName} onChange={e => setLabData({ ...labData, labBioName: e.target.value })} />
              </Field>
              <Field label="Titre">
                <select className={inputCls} value={labData.labBioTitle} onChange={e => setLabData({ ...labData, labBioTitle: e.target.value })}>
                  <option>Docteur</option>
                  <option>Professeur</option>
                  <option>Dr.</option>
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* STEP: Admin */}
        {currentStep === 'admin' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Compte Administrateur</h2>
            <p className="text-sm text-slate-500">Ce compte aura accès à tous les paramètres du système.</p>
            <Field label="Nom complet" required>
              <input autoFocus className={inputCls} type="text" placeholder="Votre nom" value={adminData.name} onChange={e => setAdminData({ ...adminData, name: e.target.value })} />
            </Field>
            <Field label="Adresse email" required>
              <input className={inputCls} type="email" placeholder="admin@laboratoire.com" value={adminData.email} onChange={e => setAdminData({ ...adminData, email: e.target.value })} />
            </Field>
            <Field label="Mot de passe" required>
              <div className="relative">
                <input
                  className={`${inputCls} pr-11`}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Minimum 6 caractères"
                  value={adminData.password}
                  onChange={e => setAdminData({ ...adminData, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="Confirmer le mot de passe" required>
              <input
                className={`${inputCls} ${adminData.confirmPassword && adminData.password !== adminData.confirmPassword ? 'border-rose-300 ring-1 ring-rose-200' : ''}`}
                type="password"
                placeholder="Répétez le mot de passe"
                value={adminData.confirmPassword}
                onChange={e => setAdminData({ ...adminData, confirmPassword: e.target.value })}
              />
              {adminData.confirmPassword && adminData.password !== adminData.confirmPassword && (
                <p className="mt-1 text-xs text-rose-500">Les mots de passe ne correspondent pas.</p>
              )}
            </Field>
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Vous serez invité à changer ce mot de passe dès la première connexion.
            </p>
          </div>
        )}

        {/* STEP: Demo */}
        {currentStep === 'demo' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Données de Démarrage</h2>
            <label className="flex cursor-pointer items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/40">
              <input
                type="checkbox"
                checked={includeDemo}
                onChange={e => setIncludeDemo(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-indigo-600"
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">Inclure le catalogue de tests cliniques</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  Installe automatiquement 56 analyses réparties sur 8 catégories : NFS, Biochimie, Thyroïde, Ionogramme, Hémostase, Sérologie, Bilan hépatique & Bilan lipidique.
                </p>
              </div>
            </label>

            {includeDemo && (
              <div className="grid grid-cols-2 gap-2">
                {['14 tests NFS complète', '4 tests Hémostase', '8 tests Biochimie', '6 tests Ionogramme', '7 tests Bilan Hépatique', '3 tests Thyroïde', '6 tests Sérologie', '4 tests Lipidique'].map(item => (
                  <div key={item} className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-medium text-amber-800">
                ⚠️ Cette étape est irréversible. Vérifiez toutes vos informations avant de lancer la configuration.
              </p>
            </div>
          </div>
        )}

        {/* STEP: Complete */}
        {currentStep === 'complete' && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">NexLab est prêt !</h2>
            <p className="mt-2 text-sm text-slate-500">Votre laboratoire a été configuré avec succès.</p>
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Compte administrateur</p>
              <p className="mt-1 font-mono text-sm font-semibold text-slate-800">{adminData.email}</p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
            >
              Accéder au tableau de bord
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}
      </div>

      {/* Navigation */}
      {currentStep !== 'complete' && (
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={stepIndex === 0 || loading}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Configuration en cours…</>
            ) : (
              <>{currentStep === 'demo' ? 'Lancer la configuration' : 'Continuer'}<ChevronRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
