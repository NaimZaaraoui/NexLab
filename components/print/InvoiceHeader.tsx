'use client';

import React from 'react';
import { LucideMicroscope } from 'lucide-react';
import type { Analysis } from '@/lib/core/types';
import type { PrintSettings } from '@/components/print/types';
import { resolvePrintBranding } from '@/lib/documents/report-generation';

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
      <div className="flex justify-between items-end mb-4 relative z-10 px-4 pt-4">
        {/* Lab identity: logo or icon + name */}
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 bg-black">
            <LucideMicroscope size={40} className="text-white" />
          </div>
          <div className="flex flex-col ml-2">
            <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight uppercase print:text-black leading-none">
              {LAB_NAME}
            </h1>
            <div className="text-xs font-black text-[var(--color-text-secondary)] uppercase tracking-[0.08em] mt-2 flex items-center gap-2">
              <span className="w-6 h-[2px] bg-indigo-600 print:bg-black"></span>
              {LAB_SUBTITLE}
            </div>
          </div>
        </div>

        {/* Invoice title */}
        <div className="flex items-center justify-end gap-5 pr-6">
          <div className="text-right">
            <h2 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-tight mb-1 print:text-black">FACTURE</h2>
            <div className="flex flex-col items-end">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Réf: {analysis.orderNumber}</p>
              {analysis.receiptNumber && (
                <p className="text-xs font-bold text-[var(--color-accent)] uppercase tracking-[0.08em] print:text-black">Quittance: {analysis.receiptNumber}</p>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};
