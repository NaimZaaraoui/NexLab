'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Save } from 'lucide-react';

type QualityEventCapaFormProps = {
  event: {
    id: string;
    rootCause: string | null;
    correctiveAction: string | null;
    preventiveAction: string | null;
    actionOwner: string | null;
    actionDueDate: string | null;
    actionStatus: string;
    verificationNote: string | null;
    resolution: string | null;
  };
};

function toDateInputValue(date: string | null) {
  if (!date) return '';
  return date.slice(0, 10);
}

export function QualityEventCapaForm({ event }: QualityEventCapaFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    rootCause: event.rootCause || '',
    correctiveAction: event.correctiveAction || '',
    preventiveAction: event.preventiveAction || '',
    actionOwner: event.actionOwner || '',
    actionDueDate: toDateInputValue(event.actionDueDate),
    actionStatus: event.actionStatus || 'PENDING',
    verificationNote: event.verificationNote || '',
    resolution: event.resolution || '',
  });

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (nextStatus?: string) => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/quality-events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          actionStatus: nextStatus || form.actionStatus,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Erreur lors de la sauvegarde CAPA');
        return;
      }

      setMessage('CAPA enregistrée');
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage('Erreur lors de la sauvegarde CAPA');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">Cause racine</span>
          <textarea
            value={form.rootCause}
            onChange={(event) => updateField('rootCause', event.target.value)}
            className="min-h-[76px] w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            placeholder="Erreur d'identification, prélèvement difficile, procédure non respectée..."
          />
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">Action corrective</span>
          <textarea
            value={form.correctiveAction}
            onChange={(event) => updateField('correctiveAction', event.target.value)}
            className="min-h-[76px] w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            placeholder="Re-prélèvement, information du prescripteur, remplacement du tube..."
          />
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">Action préventive</span>
          <textarea
            value={form.preventiveAction}
            onChange={(event) => updateField('preventiveAction', event.target.value)}
            className="min-h-[76px] w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            placeholder="Rappel procédure, formation, modification du support de prélèvement..."
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 sm:col-span-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">Responsable</span>
            <input
              value={form.actionOwner}
              onChange={(event) => updateField('actionOwner', event.target.value)}
              className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <label className="space-y-1 sm:col-span-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">Échéance</span>
            <input
              type="date"
              value={form.actionDueDate}
              onChange={(event) => updateField('actionDueDate', event.target.value)}
              className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          <label className="space-y-1 sm:col-span-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">Statut</span>
            <select
              value={form.actionStatus}
              onChange={(event) => updateField('actionStatus', event.target.value)}
              className="h-9 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            >
              <option value="PENDING">À faire</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="DONE">Réalisée</option>
              <option value="VERIFIED">Vérifiée</option>
            </select>
          </label>

          <label className="space-y-1 sm:col-span-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">Vérification / résolution</span>
            <textarea
              value={form.verificationNote}
              onChange={(event) => updateField('verificationNote', event.target.value)}
              className="min-h-[60px] w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
              placeholder="Efficacité vérifiée, pas de récidive, action acceptée..."
            />
          </label>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className={`text-xs font-medium ${message?.includes('Erreur') ? 'text-red-600' : 'text-emerald-700'}`}>
          {message || ''}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={saving}
            className="btn-secondary-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? '...' : 'Enregistrer CAPA'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('VERIFIED')}
            disabled={saving}
            className="btn-primary-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            Vérifier et clôturer
          </button>
        </div>
      </div>
    </div>
  );
}
