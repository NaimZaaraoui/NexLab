'use client';

import React from 'react';
import type { PrintSettings } from '@/components/print/types';
import { buildInvoiceItems } from '@/lib/report-generation';
import type { Result } from '@/lib/types';

interface InvoiceTableProps {
  results?: Result[];
  totalPrice?: number | null;
  settings?: PrintSettings;
}

/**
 * InvoiceTable - Renders the line items table for an invoice
 * 
 * Features:
 * - Responsive padding/font size based on number of items
 * - Professional formatting with proper alignment
 * - Total calculation with currency formatting
 * - Print-safe styling
 * 
 * @param results - Array of analysis results to display as invoice items
 * @param totalPrice - Optional override for total (uses computed if not provided)
 * @param settings - Print settings containing currency unit
 */
export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  results,
  totalPrice,
  settings,
}) => {
  const AMOUNT_UNIT = settings?.amount_unit || 'TND';

  const invoiceItemsFinal = React.useMemo(() => buildInvoiceItems(results), [results]);
  const computedTotal = React.useMemo(
    () => invoiceItemsFinal.reduce((sum, item) => sum + item.price, 0),
    [invoiceItemsFinal]
  );
  
  const finalTotal = totalPrice ?? computedTotal;
  
  const isHighVolume = invoiceItemsFinal.length >= 30;
  const isVeryHighVolume = invoiceItemsFinal.length >= 45;
  const rowPaddingClass = isVeryHighVolume ? 'py-1' : isHighVolume ? 'py-1.5' : 'py-2';
  const rowNameClass = isVeryHighVolume ? 'text-[10px]' : 'text-[11px]';
  const rowPriceClass = isVeryHighVolume ? 'text-[11px]' : 'text-[12px]';

  return (
    <div className="mb-6 relative z-10">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="bg-[var(--color-surface-muted)]/50 print:bg-black/5">
            <th className="py-2 pl-4 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 print:text-black w-[72%]">
              Désignation de l&apos;Analyse
            </th>
            <th className="py-2 pr-4 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 print:text-black w-[28%]">
              Prix ({AMOUNT_UNIT})
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoiceItemsFinal.map((item, idx) => (
            <tr key={idx} className="break-inside-avoid">
              <td className={`${rowPaddingClass} pl-4 ${rowNameClass} font-semibold text-slate-700 uppercase tracking-tight leading-tight`}>
                {item.name}
              </td>
              <td className={`${rowPaddingClass} pr-4 text-right ${rowPriceClass} font-semibold text-[var(--color-text)]`}>
                {item.price.toLocaleString(undefined, { minimumFractionDigits: 3 })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-900">
            <td className="pt-4 pb-2 pl-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] print:text-black">
              Total Net à Payer
            </td>
            <td className="pt-4 pb-2 pr-4 text-right text-2xl font-semibold text-[var(--color-text)] print:text-2xl print:text-black">
              {finalTotal?.toLocaleString(undefined, { minimumFractionDigits: 3 })}
              <span className="text-[12px] ml-1 font-bold">{AMOUNT_UNIT}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
