'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useEffect, useState } from 'react';
import {
  INSTRUMENT_TYPES,
  type CreateInstrumentPayload,
} from '@/components/temperature/types';

interface InstrumentFormModalProps {
  open: boolean;
  title: string;
  subtitle: string;
  submitLabel: string;
  payload: CreateInstrumentPayload;
  customType: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onPayloadChange: (next: CreateInstrumentPayload) => void;
  onCustomTypeChange: (value: string) => void;
}

export function InstrumentFormModal({
  open,
  title,
  subtitle,
  submitLabel,
  payload,
  customType,
  submitting,
  onClose,
  onSubmit,
  onPayloadChange,
  onCustomTypeChange,
}: InstrumentFormModalProps) {
  const [clinicalUnits, setClinicalUnits] = useState<string[]>(['°C', '°F']);

  useEffect(() => {
    if (open) {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.clinical_units) {
            setClinicalUnits(data.clinical_units.split(',').map((u: string) => u.trim()).filter(Boolean));
          }
        })
        .catch(() => {});
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (payload.unit) {
      const newUnit = payload.unit.trim();
      if (newUnit && !clinicalUnits.includes(newUnit)) {
        const updatedUnits = [...clinicalUnits, newUnit].join(', ');
        fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: { clinical_units: updatedUnits } }),
        }).catch(() => {});
        setClinicalUnits([...clinicalUnits, newUnit]);
      }
    }
    onSubmit(event);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-5 border-b">
          <DialogTitle className="text-lg font-semibold text-[var(--color-text)]">{title}</DialogTitle>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">{subtitle}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <label className="grid gap-2">
              <span className="form-label">Nom de l&apos;instrument</span>
              <input
                className="input-premium h-11"
                value={payload.name}
                onChange={(event) => onPayloadChange({ ...payload, name: event.target.value })}
                placeholder="Refrigerateur Reactifs 1"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="form-label">Type</span>
              <select
                className="input-premium h-11"
                value={payload.type}
                onChange={(event) => onPayloadChange({ ...payload, type: event.target.value })}
                required
              >
                {INSTRUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            {payload.type === 'Autre' && (
              <label className="grid gap-2">
                <span className="form-label">Type personnalise</span>
                <input
                  className="input-premium h-11"
                  value={customType}
                  onChange={(event) => onCustomTypeChange(event.target.value)}
                  placeholder="Ex: Thermobloc"
                  required
                />
              </label>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="form-label">Temperature min</span>
                <input
                  type="number"
                  step="0.1"
                  className="input-premium h-11"
                  value={payload.targetMin}
                  onChange={(event) => onPayloadChange({ ...payload, targetMin: event.target.value })}
                  required
                />
              </label>
              <label className="grid gap-2">
                <span className="form-label">Temperature max</span>
                <input
                  type="number"
                  step="0.1"
                  className="input-premium h-11"
                  value={payload.targetMax}
                  onChange={(event) => onPayloadChange({ ...payload, targetMax: event.target.value })}
                  required
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="form-label">Unite</span>
                <input
                  list="instrument-clinical-units"
                  className="input-premium h-11"
                  value={payload.unit}
                  onChange={(event) => onPayloadChange({ ...payload, unit: event.target.value })}
                  placeholder="°C"
                />
                <datalist id="instrument-clinical-units">
                  {clinicalUnits.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </label>
              <label className="grid gap-2">
                <span className="form-label">Emplacement</span>
                <input
                  className="input-premium h-11"
                  value={payload.location}
                  onChange={(event) => onPayloadChange({ ...payload, location: event.target.value })}
                  placeholder="Paillasse principale"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t px-6 py-4">
            <button type="button" className="btn-secondary-sm" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-primary-sm" disabled={submitting}>
              {submitting ? `${submitLabel}...` : submitLabel}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
