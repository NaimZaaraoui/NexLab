'use client';

import React from 'react';
import { LucideMicroscope } from 'lucide-react';
import type { Analysis } from '@/lib/types';
import type { PrintSettings } from '@/components/print/types';
import { resolvePrintBranding } from '@/lib/report-generation';

interface InvoiceHeaderProps {
  analysis: Analysis;
  settings?: PrintSettings;
}

/**
 * InvoiceHeader - Renders the branding and reference section of an invoice
 * 
 * Includes:
 * - Laboratory branding (logo, name, subtitle)
 * - Invoice title
 * - Order number and receipt number (if available)
 * - Print-safe styling with decorative bars
 * 
 * @param analysis - The analysis containing order and receipt numbers
 * @param settings - Print settings containing lab branding
 */
export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ analysis, settings }) => {
  const { LAB_NAME, LAB_SUBTITLE } = resolvePrintBranding(settings);

  return (
    <>
      <div className="absolute top-0 right-0 w-1/3 h-1 bg-slate-900 print:bg-black"></div>
      <div className="absolute top-0 left-0 w-12 h-1 bg-indigo-600 print:bg-black"></div>

      <div className="flex justify-between items-end mb-8 relative z-10 pt-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 bg-black rounded-md">
            <LucideMicroscope size={40} className="text-white" />
          </div>
          <div className="flex flex-col ml-2">
            <h1 className="text-4xl font-semibold text-[var(--color-text)] tracking-[-0.03em] uppercase print:text-black leading-none">
              {LAB_NAME}
            </h1>
            <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.24em] mt-1.5 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-indigo-600 print:bg-black"></span>
              {LAB_SUBTITLE.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="text-right border-r-4 border-indigo-600 pr-6 print:border-black">
          <h2 className="text-2xl font-semibold text-[var(--color-text)] uppercase tracking-tight mb-1 print:text-black">FACTURE</h2>
          <div className="flex flex-col items-end">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide print:text-black">Référence: {analysis.orderNumber}</p>
            {analysis.receiptNumber && (
              <p className="text-[10px] font-semibold text-[var(--color-accent)] uppercase tracking-wide print:text-black">Quittance: {analysis.receiptNumber}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
