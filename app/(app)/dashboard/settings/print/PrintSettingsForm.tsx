'use client';

import { useState } from 'react';
import { Save, Loader2, UploadCloud, Trash2, Image as ImageIcon } from 'lucide-react';

interface Props {
  initialSettings: Record<string, string>;
}

function ToggleSwitch({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface-muted)]'
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function PrintSettingsForm({ initialSettings }: Props) {
  const [values, setValues] = useState<Record<string, string>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [logoUrl, setLogoUrl] = useState(initialSettings.lab_logo || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState('');

  const [stampUrl, setStampUrl] = useState(initialSettings.lab_stamp_image || '');
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [stampError, setStampError] = useState('');

  const [signatureUrl, setSignatureUrl] = useState(initialSettings.lab_bio_signature || '');
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [signatureError, setSignatureError] = useState('');

  const [initialValues, setInitialValues] = useState<Record<string, string>>(initialSettings);

  const isDirty = Object.keys(values).some(k => values[k] !== initialValues[k]);

  const set = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setSuccess(false);
    setError(null);
  };

  const setBool = (key: string, val: boolean) => set(key, val ? 'true' : 'false');
  const getBool = (key: string, defaultVal = true) =>
    key in values ? values[key] === 'true' : defaultVal;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: values }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la sauvegarde.');
        return;
      }
      setValues(data);
      setInitialValues(data);
      setSuccess(true);
    } catch {
      setError('Erreur réseau.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    setLogoError('');
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await fetch('/api/settings/logo', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setLogoError(data.error || 'Erreur lors du chargement'); return; }
      const newUrl = data.url + '?t=' + Date.now();
      setLogoUrl(newUrl);
      setValues(prev => ({ ...prev, lab_logo: newUrl }));
    } catch {
      setLogoError('Erreur réseau lors de l\'upload');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    try {
      const res = await fetch('/api/settings/logo', { method: 'DELETE' });
      if (res.ok) {
        setLogoUrl('');
        setValues(prev => ({ ...prev, lab_logo: '' }));
      }
    } catch { }
  };

  const handleStampUpload = async (file: File) => {
    setUploadingStamp(true);
    setStampError('');
    try {
      const fd = new FormData();
      fd.append('stamp', file);
      const res = await fetch('/api/settings/stamp', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setStampError(data.error || 'Erreur lors du chargement'); return; }
      const newUrl = data.url + '?t=' + Date.now();
      setStampUrl(newUrl);
      setValues(prev => ({ ...prev, lab_stamp_image: newUrl }));
    } catch {
      setStampError('Erreur réseau lors de l\'upload');
    } finally {
      setUploadingStamp(false);
    }
  };

  const handleStampDelete = async () => {
    try {
      const res = await fetch('/api/settings/stamp', { method: 'DELETE' });
      if (res.ok) {
        setStampUrl('');
        setValues(prev => ({ ...prev, lab_stamp_image: '' }));
      }
    } catch { }
  };

  const handleSignatureUpload = async (file: File) => {
    setUploadingSignature(true);
    setSignatureError('');
    try {
      const fd = new FormData();
      fd.append('signature', file);
      const res = await fetch('/api/settings/signature', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setSignatureError(data.error || 'Erreur lors du chargement'); return; }
      const newUrl = data.url + '?t=' + Date.now();
      setSignatureUrl(newUrl);
      setValues(prev => ({ ...prev, lab_bio_signature: newUrl }));
    } catch {
      setSignatureError('Erreur réseau lors de l\'upload');
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleSignatureDelete = async () => {
    try {
      const res = await fetch('/api/settings/signature', { method: 'DELETE' });
      if (res.ok) {
        setSignatureUrl('');
        setValues(prev => ({ ...prev, lab_bio_signature: '' }));
      }
    } catch { }
  };

  const inputClass = 'input-premium w-full';

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.12em] mb-4 flex items-center gap-3">
      <span className="w-6 h-[1px] bg-[var(--color-surface-muted)]" />
      {children}
      <span className="flex-1 h-[1px] bg-[var(--color-surface-muted)]" />
    </h2>
  );

  const ImageUploadBlock = ({
    url, uploading, error: uploadError, inputId, fieldName, onUpload, onDelete,
    label, hint,
  }: {
    url: string; uploading: boolean; error: string; inputId: string; fieldName: string;
    onUpload: (f: File) => void; onDelete: () => void; label: string; hint: string;
  }) => (
    <div className="flex flex-col gap-6 items-center">
      <div className="relative group">
        {url ? (
          <div className="relative group">
            <img src={url} alt={label} className="h-40 w-48 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-2 object-contain" />
            <button
              onClick={onDelete}
              className="absolute -right-2 -top-2 rounded-full bg-rose-100 p-1.5 text-rose-600 opacity-0 transition-opacity hover:bg-rose-200 group-hover:opacity-100"
              title={`Supprimer ${label.toLowerCase()}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div className="flex h-40 w-48 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-slate-300">
            <ImageIcon size={32} strokeWidth={1.5} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-center px-4">Aucun fichier configuré</span>
          </div>
        )}
      </div>
      <div className="w-full space-y-3">
        <div
          className={`relative cursor-pointer rounded-md border-2 border-dashed p-5 text-center transition-all ${
            uploading ? 'border-slate-300 bg-[var(--color-surface-muted)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-slate-400 hover:bg-slate-50'
          }`}
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <input
            id={inputId}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
          />
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <><Loader2 size={22} className="animate-spin text-slate-600" /><p className="text-xs font-semibold text-slate-700">Chargement...</p></>
            ) : (
              <><UploadCloud size={22} className="text-slate-400" /><p className="text-xs font-semibold text-[var(--color-text)]">Cliquez ou glissez votre fichier ici</p><p className="text-[10px] text-slate-400 font-medium">JPG, PNG ou WebP — Max 2MB</p></>
            )}
          </div>
        </div>
        {uploadError && <p className="rounded-md border border-rose-100 bg-rose-50 px-3 py-1.5 text-[10px] font-semibold text-rose-500">⚠️ {uploadError}</p>}
        <p className="text-[11px] text-slate-400 font-medium italic text-center">{hint}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* Logo du laboratoire */}
      <div className="rounded-xl border bg-[var(--color-surface)] p-6 space-y-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <SectionTitle>Logo du laboratoire</SectionTitle>
        <ImageUploadBlock
          url={logoUrl}
          uploading={uploadingLogo}
          error={logoError}
          inputId="logo-upload"
          fieldName="lab_logo"
          onUpload={handleLogoUpload}
          onDelete={handleLogoDelete}
          label="Logo"
          hint="Ce logo s'affichera dans l'en-tête de tous vos rapports d'analyse, à la place de l'icône par défaut."
        />
      </div>

      {/* Cachet + Signature */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-[var(--color-surface)] p-6 space-y-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <SectionTitle>Cachet officiel du laboratoire</SectionTitle>
          <ImageUploadBlock
            url={stampUrl}
            uploading={uploadingStamp}
            error={stampError}
            inputId="stamp-upload"
            fieldName="lab_stamp_image"
            onUpload={handleStampUpload}
            onDelete={handleStampDelete}
            label="Cachet"
            hint="Si aucun cachet n'est chargé, un espace vide sera réservé pour l'apposition manuelle."
          />
        </div>
        <div className="rounded-xl border bg-[var(--color-surface)] p-6 space-y-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <SectionTitle>Signature du biologiste</SectionTitle>
          <ImageUploadBlock
            url={signatureUrl}
            uploading={uploadingSignature}
            error={signatureError}
            inputId="signature-upload"
            fieldName="lab_bio_signature"
            onUpload={handleSignatureUpload}
            onDelete={handleSignatureDelete}
            label="Signature"
            hint="Cette signature sera superposée au cachet officiel sur tous les rapports validés."
          />
        </div>
      </div>

      {/* Mise en page du rapport */}
      <div className="rounded-xl border bg-[var(--color-surface)] p-6 space-y-5 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <SectionTitle>Mise en page du rapport</SectionTitle>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-soft)] uppercase tracking-[0.12em] mb-1.5">
            Titre du rapport
          </label>
          <input
            type="text"
            className={inputClass}
            value={values.report_title ?? ''}
            onChange={e => set('report_title', e.target.value)}
            placeholder="RAPPORT D'ANALYSE (par défaut)"
          />
          <p className="mt-1.5 text-[11px] text-slate-400">Laissez vide pour conserver le titre par défaut.</p>
        </div>

        <div className="space-y-4 pt-2">
          <p className="text-xs font-semibold text-[var(--color-text-soft)] uppercase tracking-[0.12em]">Champs affichés</p>

          {[
            { key: 'report_show_doctor', label: 'Médecin prescripteur', desc: 'Affiche le nom du médecin en en-tête', defaultVal: true },
            { key: 'report_show_barcode', label: 'Code QR', desc: 'Affiche le code QR de vérification', defaultVal: true },
            { key: 'report_show_provenance', label: 'Provenance', desc: 'Affiche le champ de provenance du patient', defaultVal: false },
            { key: 'report_show_previous_result', label: 'Résultat précédent (Antér.)', desc: "Affiche la colonne des résultats antérieurs dans le tableau d'analyse", defaultVal: true },
            { key: 'report_show_cbc_indices', label: 'Indices NFS calculés', desc: 'Affiche la page optionnelle des indices NFS dans le dossier et le PDF', defaultVal: true },
          ].map(({ key, label, desc, defaultVal }) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-xl border bg-[var(--color-surface-muted)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">{label}</p>
                <p className="text-xs text-[var(--color-text-soft)]">{desc}</p>
              </div>
              <ToggleSwitch
                id={key}
                checked={getBool(key, defaultVal)}
                onChange={(v) => setBool(key, v)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Pied de page */}
      <div className="rounded-xl border bg-[var(--color-surface)] p-6 space-y-6 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <SectionTitle>Pied de page du rapport</SectionTitle>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-soft)] uppercase tracking-[0.12em] mb-1.5">Note du biologiste (Disclaimer)</label>
          <textarea
            className={`${inputClass} resize-none h-20`}
            value={values.report_disclaimer ?? ''}
            onChange={e => set('report_disclaimer', e.target.value)}
            placeholder="Les résultats indiqués ci-dessus ont été obtenus par des méthodes validées..."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--color-text-soft)] uppercase tracking-[0.12em] mb-1.5">Texte de pied de page global</label>
          <textarea
            className={`${inputClass} resize-none h-20`}
            value={values.lab_footer_text ?? ''}
            onChange={e => set('lab_footer_text', e.target.value)}
            placeholder="Avertissements légaux, horaires, ou notes générales s'appliquant en bas de chaque page."
          />
        </div>
      </div>

      {/* Save bar */}
      <div className="flex flex-col gap-3 sticky bottom-6">
        {isDirty && !success && (
          <div className="flex items-center gap-2 self-start rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Modifications non enregistrées
          </div>
        )}
        {error && <p className="rounded-md border border-rose-100 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600">{error}</p>}
        {success && <p className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">✓ Paramètres d&apos;impression enregistrés</p>}
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="btn-primary w-full h-14 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 size={16} className="animate-spin" /> Enregistrement...</> : <><Save size={16} /> Enregistrer les paramètres</>}
        </button>
      </div>
    </div>
  );
}
