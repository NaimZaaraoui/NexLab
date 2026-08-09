'use client';

import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Analysis } from '@/lib/core/types';
import type { PrintSettings } from '@/components/print/types';
import { PrintDocHeader } from '@/components/print/PrintDocHeader';

interface InvoiceHeaderProps {
  analysis: Analysis;
  settings?: PrintSettings;
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ analysis, settings }) => {
  const patientName = `${analysis.patient?.firstName || ''} ${analysis.patient?.lastName || ''}`.trim() || 'PATIENT SANS NOM';
  const age = analysis.patient?.birthDate
    ? Math.floor((new Date().getTime() - new Date(analysis.patient.birthDate).getTime()) / 31557600000)
    : null;
  const gender = analysis.patient?.gender === 'M' ? 'Homme' : 'Femme';
  const dateFacture = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  const datePrel = format(new Date(analysis.creationDate), 'dd MMMM yyyy', { locale: fr });

  return (
    <PrintDocHeader
      settings={settings}
      docTitle="FACTURE"
      docRef={`Réf: ${analysis.orderNumber}`}
      docAccent={analysis.receiptNumber ? `Quittance: ${analysis.receiptNumber}` : undefined}
      qrValue={analysis.orderNumber}
      infoLabel="Patient"
      infoTitle={patientName}
      infoChips={
        <>
          {age !== null && <span>{age} ans</span>}
          <span className="text-slate-300 print:text-black/30">·</span>
          <span className="uppercase font-bold">{gender}</span>
          <span className="text-slate-300 print:text-black/30">·</span>
          <span>ID: <span className="font-bold font-mono text-[var(--color-text)] print:text-black">{analysis.dailyId || analysis.patientId.slice(0, 8).toUpperCase()}</span></span>
        </>
      }
      metaCells={[
        { label: 'Date Facture', value: dateFacture },
        { label: 'Prélèvement', value: datePrel },
      ]}
    />
  );
};

