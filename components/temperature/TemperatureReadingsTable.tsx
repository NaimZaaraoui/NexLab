'use client';

import { Edit3, Trash2 } from 'lucide-react';
import type { Instrument, TemperatureReading } from '@/components/temperature/types';

interface TemperatureReadingsTableProps {
  readings: TemperatureReading[];
  instrument: Instrument | null;
  loading: boolean;
  canEdit: boolean;
  onEdit: (reading: TemperatureReading) => void;
  onInvalidate: (reading: TemperatureReading) => void;
}

export function TemperatureReadingsTable({
  readings,
  instrument,
  loading,
  canEdit,
  onEdit,
  onInvalidate,
}: TemperatureReadingsTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
      <div className="flex items-center justify-between border-b bg-[var(--color-surface-muted)] px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Relevés du mois</h2>
          <p className="mt-1 text-xs text-[var(--color-text-soft)]">{readings.length} mesure(s) enregistrée(s)</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b bg-[var(--color-surface)] text-left">
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Date</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Période</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Valeur</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Statut</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Action corrective</th>
              <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">Saisi par</th>
              {canEdit && (
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">
                  Chargement des relevés...
                </td>
              </tr>
            )}
            {!loading && readings.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="px-5 py-10 text-center text-sm text-[var(--color-text-soft)]">
                  Aucun relevé sur la période sélectionnée.
                </td>
              </tr>
            )}
            {!loading &&
              readings.map((reading) => (
                <tr key={reading.id} className="hover:bg-[var(--color-surface-muted)]/50">
                  <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                    {new Date(reading.recordedAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-5 py-4 text-sm capitalize text-[var(--color-text-secondary)]">{reading.period}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-[var(--color-text)]">
                    {reading.value} {instrument?.unit}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`status-pill rounded-md px-2.5 py-1 ${reading.isOutOfRange ? 'status-pill-error' : 'status-pill-success'}`}>
                      {reading.isOutOfRange ? 'Hors plage' : 'Conforme'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-[var(--color-text-soft)]">{reading.correctiveAction || '—'}</td>
                  <td className="px-5 py-4 text-xs text-[var(--color-text-soft)]">{reading.recordedBy || '—'}</td>
                  {canEdit && (
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="btn-secondary-sm" onClick={() => onEdit(reading)}>
                          <Edit3 size={14} />
                          Corriger
                        </button>
                        <button className="btn-secondary-sm" onClick={() => onInvalidate(reading)}>
                          <Trash2 size={14} />
                          Annuler
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
