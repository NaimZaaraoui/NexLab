'use client';

import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Analysis } from '@/lib/types';
import type { PrintSettings } from '@/components/print/types';
import { resolvePrintBranding } from '@/lib/report-generation';

interface PatientInvoiceSectionProps {
  analysis: Analysis;
  settings?: PrintSettings;
}

/**
 * PatientInvoiceSection - Renders patient info and invoice dates
 * 
 * Displays:
 * - Patient name, age, gender, ID
 * - Invoice date
 * - Sample collection date
 * - Laboratory establishment info
 * 
 * @param analysis - The analysis with patient and date information
 * @param settings - Print settings for lab name and address
 */
export const PatientInvoiceSection: React.FC<PatientInvoiceSectionProps> = ({ analysis, settings }) => {
  const { LAB_NAME, LAB_ADDRESS } = resolvePrintBranding(settings);

  const patientName = `${analysis.patientFirstName || ''} ${analysis.patientLastName || ''}`.trim() || 'PATIENT SANS NOM';
  const dateFacture = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  const dateEdition = format(new Date(analysis.creationDate), 'dd MMMM yyyy', { locale: fr });

  return (
    <div className="grid grid-cols-12 gap-8 mb-8 relative z-10">
      <div className="col-span-5">
        <div className="mb-4">
          <span className="text-[10px] font-semibold text-[var(--color-accent)] uppercase tracking-[0.2em] print:text-black">Patient</span>
          <div className="h-px bg-[var(--color-surface-muted)] mt-1 print:bg-black/10"></div>
        </div>
        <div className="flex flex-col">
          <h3 className="text-3xl font-semibold text-[var(--color-text)] mb-2 print:text-2xl print:text-black">{patientName}</h3>
          <div className="flex gap-4 text-sm font-medium text-[var(--color-text-soft)] print:text-black">
            <span>{analysis.patientAge} ans</span>
            <span className="text-slate-200 print:text-black/30">|</span>
            <span className="uppercase">{analysis.patientGender === 'M' ? 'Homme' : 'Femme'}</span>
            <span className="text-slate-200 print:text-black/30">|</span>
            <span>ID: <span className="font-bold font-mono text-[var(--color-text)] print:text-black">{analysis.dailyId}</span></span>
          </div>
        </div>
      </div>

      <div className="col-span-7 grid grid-cols-2 gap-4">
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] print:text-black/60">Date Facture</span>
          <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">{dateFacture}</p>
        </div>
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] print:text-black/60">Prélèvement</span>
          <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">{dateEdition}</p>
        </div>
        <div className="col-span-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] print:text-black/60">Établissement</span>
          <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">{LAB_NAME}{LAB_ADDRESS ? ` — ${LAB_ADDRESS}` : ''}</p>
        </div>
      </div>
    </div>
  );
};
