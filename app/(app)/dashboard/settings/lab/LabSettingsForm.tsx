'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, FlaskConical, Coins, Info, Building2, MapPin, UserCheck, Clock } from 'lucide-react';
import { NotificationToast } from '@/components/ui/notification-toast';

export function LabSettingsForm() {
  const [settings, setSettings] = useState<Record<string, string>>({
    sample_types: 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite',
    sample_containers: 'Tube EDTA, Tube sec, Tube citrate, Tube héparine, Tube gel séparateur, Flacon urines, Écouvillon, Pot stérile',
    sample_conditions: 'Conforme, Hémolysé, Lipémique, Ictérique, Coagulé, Volume insuffisant, Tube mal identifié, Échantillon altéré',
    provenance_options: 'Consultation, Externe, Interne, Urgence, Médecin traitant, Maternité, Chirurgie',
    prescriber_options: '',
    clinical_units: 'g/L, mg/L, µg/L, mmol/L, µmol/L, nmol/L, U/L, %, Ratio, Log',
    amount_unit: 'DA',
    lab_name: '',
    lab_subtitle: '',
    lab_parent: '',
    lab_address_1: '',
    lab_address_2: '',
    lab_phone: '',
    lab_email: '',
    lab_bio_title: 'Docteur',
    lab_bio_name: '',
    lab_bio_onmpt: '',
    tat_warn: '45',
    tat_alert: '60',
    diatron_enabled: 'false',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings({
          sample_types: data.sample_types || 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite',
          sample_containers: data.sample_containers || 'Tube EDTA, Tube sec, Tube citrate, Tube héparine, Tube gel séparateur, Flacon urines, Écouvillon, Pot stérile',
          sample_conditions: data.sample_conditions || 'Conforme, Hémolysé, Lipémique, Ictérique, Coagulé, Volume insuffisant, Tube mal identifié, Échantillon altéré',
          provenance_options: data.provenance_options || 'Consultation, Externe, Interne, Urgence, Médecin traitant, Maternité, Chirurgie',
          prescriber_options: data.prescriber_options || '',
          clinical_units: data.clinical_units || 'g/L, mg/L, µg/L, mmol/L, µmol/L, nmol/L, U/L, %, Ratio, Log',
          amount_unit: data.amount_unit || 'DA',
          lab_name: data.lab_name || '',
          lab_subtitle: data.lab_subtitle || '',
          lab_parent: data.lab_parent || '',
          lab_address_1: data.lab_address_1 || '',
          lab_address_2: data.lab_address_2 || '',
          lab_phone: data.lab_phone || '',
          lab_email: data.lab_email || '',
          lab_bio_title: data.lab_bio_title || 'Docteur',
          lab_bio_name: data.lab_bio_name || '',
          lab_bio_onmpt: data.lab_bio_onmpt || '',
          tat_warn: data.tat_warn || '45',
          tat_alert: data.tat_alert || '60',
          diatron_enabled: data.diatron_enabled || 'false',
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        setNotification({ type: 'success', message: 'Paramètres enregistrés avec succès' });
      } else {
        const data = await res.json();
        setNotification({ type: 'error', message: data.error || 'Erreur lors de l\'enregistrement' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Erreur réseau' });
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  const inputClass = 'input-premium h-11 w-full';

  return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECTION: Identité et Coordonnées */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-10">
        
        {/* Identité du laboratoire */}
        <div className="rounded-xl border bg-[var(--color-surface)] p-6 sm:p-7 space-y-6 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Identité du laboratoire</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Informations principales sur l&apos;établissement.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="form-label mb-1.5">
                Nom du laboratoire <span className="text-rose-400">*</span>
              </label>
              <input
                className={inputClass}
                value={settings.lab_name}
                onChange={e => setSettings({ ...settings, lab_name: e.target.value })}
                placeholder="CSSB GALLEL"
              />
            </div>
            <div>
              <label className="form-label mb-1.5">Sous-titre</label>
              <input
                className={inputClass}
                value={settings.lab_subtitle}
                onChange={e => setSettings({ ...settings, lab_subtitle: e.target.value })}
                placeholder="Service de Biologie Médicale"
              />
            </div>
            <div>
              <label className="form-label mb-1.5">Établissement parent</label>
              <input
                className={inputClass}
                value={settings.lab_parent}
                onChange={e => setSettings({ ...settings, lab_parent: e.target.value })}
                placeholder="Hôpital / Clinique (optionnel)"
              />
            </div>
          </div>
        </div>

        {/* Coordonnées */}
        <div className="rounded-xl border bg-[var(--color-surface)] p-6 sm:p-7 space-y-6 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Coordonnées</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Adresse et moyens de contact.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="form-label mb-1.5">Adresse ligne 1</label>
              <input className={inputClass} value={settings.lab_address_1} onChange={e => setSettings({ ...settings, lab_address_1: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="form-label mb-1.5">Adresse ligne 2</label>
              <input className={inputClass} value={settings.lab_address_2} onChange={e => setSettings({ ...settings, lab_address_2: e.target.value })} />
            </div>
            <div>
              <label className="form-label mb-1.5">Téléphone</label>
              <input className={inputClass} value={settings.lab_phone} onChange={e => setSettings({ ...settings, lab_phone: e.target.value })} placeholder="+216 XX XXX XXX" />
            </div>
            <div>
              <label className="form-label mb-1.5">Email</label>
              <input className={inputClass} type="email" value={settings.lab_email} onChange={e => setSettings({ ...settings, lab_email: e.target.value })} placeholder="labo@example.com" />
            </div>
          </div>
        </div>

      </div>

      {/* SECTION: Settings Métier */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-10">
        
        {/* Sample Types Configuration */}
        <div className="rounded-xl border bg-[var(--color-surface)] p-6 sm:p-7 space-y-6 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
              <FlaskConical size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Listes configurables</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">Définir les options disponibles pour vos formulaires et tests.</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="section-label ml-1">Types d&apos;échantillons (séparés par des virgules)</label>
              <textarea
                value={settings.sample_types}
                onChange={(e) => setSettings({ ...settings, sample_types: e.target.value })}
                className="input-premium min-h-[90px] rounded-md bg-[var(--color-surface-muted)]/50 py-3 text-sm font-medium"
                placeholder="Ex: Sang total, Urine, LCR..."
              />
            </div>

            <div className="space-y-2">
              <label className="section-label ml-1">Contenants d&apos;échantillons (séparés par des virgules)</label>
              <textarea
                value={settings.sample_containers}
                onChange={(e) => setSettings({ ...settings, sample_containers: e.target.value })}
                className="input-premium min-h-[90px] rounded-md bg-[var(--color-surface-muted)]/50 py-3 text-sm font-medium"
                placeholder="Ex: Tube EDTA, Tube sec, Flacon urines..."
              />
            </div>

            <div className="space-y-2">
              <label className="section-label ml-1">États d&apos;échantillons (séparés par des virgules)</label>
              <textarea
                value={settings.sample_conditions}
                onChange={(e) => setSettings({ ...settings, sample_conditions: e.target.value })}
                className="input-premium min-h-[90px] rounded-md bg-[var(--color-surface-muted)]/50 py-3 text-sm font-medium"
                placeholder="Ex: Conforme, Hémolysé, Lipémique..."
              />
            </div>

            <div className="space-y-2">
              <label className="section-label ml-1">Provenances (séparées par des virgules)</label>
              <textarea
                value={settings.provenance_options}
                onChange={(e) => setSettings({ ...settings, provenance_options: e.target.value })}
                className="input-premium min-h-[90px] rounded-md bg-[var(--color-surface-muted)]/50 py-3 text-sm font-medium"
                placeholder="Ex: Consultation, Externe, Urgence..."
              />
            </div>

            <div className="space-y-2">
              <label className="section-label ml-1">Médecins prescripteurs (séparés par des virgules)</label>
              <textarea
                value={settings.prescriber_options}
                onChange={(e) => setSettings({ ...settings, prescriber_options: e.target.value })}
                className="input-premium min-h-[90px] rounded-md bg-[var(--color-surface-muted)]/50 py-3 text-sm font-medium"
                placeholder="Ex: Dr. Nom Prénom, Service Urgences..."
              />
            </div>
            
            <div className="space-y-2">
              <label className="section-label ml-1">Unités de mesure cliniques (séparées par des virgules)</label>
              <textarea
                value={settings.clinical_units}
                onChange={(e) => setSettings({ ...settings, clinical_units: e.target.value })}
                className="input-premium min-h-[90px] rounded-md bg-[var(--color-surface-muted)]/50 py-3 text-sm font-medium"
                placeholder="Ex: g/L, mmol/L, %, mg..."
              />
            </div>
            
            <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
              <Info size={16} className="mt-0.5 shrink-0 text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-tight text-slate-600 leading-relaxed">
                Ces options fourniront une auto-complétion intelligente lors de la configuration de votre catalogue technique (tests), de votre inventaire et de vos paramètres QC.
              </p>
            </div>
          </div>
        </div>

        {/* Biologiste & TAT & Monnaie */}
        <div className="flex flex-col gap-8">
          
          <div className="rounded-xl border bg-[var(--color-surface)] p-6 sm:p-7 space-y-6 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
                <UserCheck size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">Biologiste responsable</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Pour les rapports et l&apos;affichage global.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div>
                <label className="form-label mb-1.5">Titre</label>
                <select className={inputClass} value={settings.lab_bio_title} onChange={e => setSettings({ ...settings, lab_bio_title: e.target.value })}>
                  <option value="Docteur">Docteur</option>
                  <option value="Professeur">Professeur</option>
                  <option value="Dr.">Dr.</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="form-label mb-1.5">Nom complet</label>
                <input className={inputClass} value={settings.lab_bio_name} onChange={e => setSettings({ ...settings, lab_bio_name: e.target.value })} placeholder="Prénom NOM" />
              </div>
              <div className="md:col-span-3">
                <label className="form-label mb-1.5">N° ONMPT</label>
                <input className={inputClass} value={settings.lab_bio_onmpt} onChange={e => setSettings({ ...settings, lab_bio_onmpt: e.target.value })} placeholder="Numéro d&apos;inscription à l&apos;Ordre" />
              </div>
            </div>
          </div>



          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
            {/* Seuils TAT */}
            <div className="rounded-xl border bg-[var(--color-surface)] p-6 space-y-5 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Seuils TAT</h3>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Avertissement</label>
                  <div className="relative">
                    <input className={`${inputClass} pr-14`} type="number" min="1" max="480" value={settings.tat_warn} onChange={e => setSettings({ ...settings, tat_warn: e.target.value })} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">min</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Dépassement</label>
                  <div className="relative">
                    <input className={`${inputClass} pr-14`} type="number" min="1" max="480" value={settings.tat_alert} onChange={e => setSettings({ ...settings, tat_alert: e.target.value })} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Currency Configuration */}
            <div className="rounded-xl border bg-[var(--color-surface)] p-6 space-y-5 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
                  <Coins size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">Monnaie</h3>
                </div>
              </div>

              <div>
                <label className="section-label ml-1">Symbole ou unité</label>
                <input
                  value={settings.amount_unit}
                  onChange={(e) => setSettings({ ...settings, amount_unit: e.target.value })}
                  className="input-premium mt-1.5 h-11 rounded-md bg-[var(--color-surface-muted)]/50 text-center font-semibold"
                  placeholder="DA"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION: Intégrations Automates */}
      <div className="rounded-xl border bg-[var(--color-surface)] p-6 sm:p-7 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--color-text)]">Intégration automate Diatron</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Activez uniquement si votre laboratoire dispose d&apos;un automate Diatron Abacus 380. Affiche le bouton d&apos;import de fichier .txt dans le formulaire de saisie des résultats.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.diatron_enabled === 'true'}
            onClick={() => setSettings({ ...settings, diatron_enabled: settings.diatron_enabled === 'true' ? 'false' : 'true' })}
            className={`relative shrink-0 h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 ${
              settings.diatron_enabled === 'true' ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              settings.diatron_enabled === 'true' ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </div>

      <div className="sticky bottom-8 flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex h-12 items-center gap-2 px-8 transition-all active:scale-95"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span className="text-sm font-semibold uppercase tracking-[0.08em]">Enregistrer les réglages</span>
        </button>
      </div>

      {notification && (
        <NotificationToast type={notification.type} message={notification.message} />
      )}
    </div>
  );
}
