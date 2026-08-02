'use client';

import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Analysis } from '@/lib/core/types';
import type { PrintSettings } from '@/components/print/types';
import { resolvePrintBranding } from '@/lib/documents/report-generation';

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

  const patientName = `${analysis.patient?.firstName || ''} ${analysis.patient?.lastName || ''}`.trim() || 'PATIENT SANS NOM';
  const age = analysis.patient?.birthDate 
    ? Math.floor((new Date().getTime() - new Date(analysis.patient.birthDate).getTime()) / 31557600000) 
    : '?';
  const gender = analysis.patient?.gender === 'M' ? 'Homme' : analysis.patient?.gender === 'F' ? 'Femme' : '?';
  const dateFacture = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  const dateEdition = format(new Date(analysis.creationDate), 'dd MMMM yyyy', { locale: fr });

  return (
    <div className="grid grid-cols-12 gap-4 mb-8 relative z-10 px-4">
      <div className="col-span-12 h-px bg-[var(--color-surface-muted)] print:bg-black/10"></div>
      <div className="col-span-5">
        <span className="text-xs font-black text-[var(--color-accent)] uppercase tracking-[0.08em] print:text-black">Patient</span>
        <div className="flex flex-col mt-2">
          <h3 className="text-2xl font-black text-[var(--color-text)] mb-2 print:text-black">{patientName}</h3>
          <div className="flex gap-4 text-sm font-medium text-[var(--color-text-secondary)] print:text-black">
            <span>{age} ans</span>
            <span className="text-slate-200 print:text-black/30">|</span>
            <span>{gender}</span>
            <span className="text-slate-200 print:text-black/30">|</span>
            <span>ID: <span className="font-bold font-mono text-[var(--color-text)] print:text-black">{analysis.dailyId || analysis.patientId.slice(0, 8).toUpperCase()}</span></span>
          </div>
        </div>
      </div>

      <div className="col-span-7 grid grid-cols-2 gap-4 pt-2">
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Date Facture</span>
          <p className="text-xs font-bold text-[var(--color-text)] mt-1 print:text-black">{dateFacture}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Prélèvement</span>
          <p className="text-xs font-bold text-[var(--color-text)] mt-1 print:text-black">{dateEdition}</p>
        </div>
        <div className="col-span-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Établissement</span>
          <p className="text-xs font-bold text-[var(--color-text)] mt-1 print:text-black">{LAB_NAME}{LAB_ADDRESS ? ` — ${LAB_ADDRESS}` : ''}</p>
        </div>
      </div>
    </div>
  );
};
