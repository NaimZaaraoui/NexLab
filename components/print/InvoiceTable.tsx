'use client';

import React from 'react';
import type { PrintSettings } from '@/components/print/types';
import { buildInvoiceItems } from '@/lib/documents/report-generation';
import type { Result } from '@/lib/core/types';

interface InvoiceTableProps {
  results?: Result[];
  totalPrice?: number | null;
  settings?: PrintSettings;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ results, totalPrice, settings }) => {
  const AMOUNT_UNIT = settings?.amount_unit || 'TND';

  const invoiceItemsFinal = React.useMemo(() => buildInvoiceItems(results), [results]);
  const computedTotal = React.useMemo(
    () => invoiceItemsFinal.reduce((sum, item) => sum + item.price, 0),
    [invoiceItemsFinal]
  );

  const finalTotal = totalPrice ?? computedTotal;
  const isHighVolume = invoiceItemsFinal.length >= 30;
  const isVeryHighVolume = invoiceItemsFinal.length >= 45;
  const rowPy = isVeryHighVolume ? 'py-1' : isHighVolume ? 'py-1.5' : 'py-2.5';
  const rowTextName = isVeryHighVolume ? 'text-xs' : 'text-[12px]';
  const rowTextPrice = isVeryHighVolume ? 'text-[11px]' : 'text-[13px]';

  return (
    <div className="mb-6 relative z-10 px-4">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            <th className="py-2 pl-2 text-left text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 print:text-black/60 w-[72%] border-b border-[var(--color-surface-muted)] print:border-black/10">
              Désignation de l&apos;Analyse
            </th>
            <th className="py-2 pr-2 text-right text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 print:text-black/60 w-[28%] border-b border-[var(--color-surface-muted)] print:border-black/10">
              Prix ({AMOUNT_UNIT})
            </th>
          </tr>
        </thead>
        <tbody>
          {invoiceItemsFinal.map((item, idx) => (
            <tr key={idx} className={`break-inside-avoid border-b border-[var(--color-surface-muted)]/60 print:border-black/[0.06] ${idx % 2 === 1 ? 'bg-[var(--color-surface-muted)]/30 print:bg-black/[0.025]' : ''}`}>
              <td className={`${rowPy} pl-2 ${rowTextName} font-semibold text-[var(--color-text)] print:text-black uppercase tracking-tight leading-tight`}>
                {item.name}
              </td>
              <td className={`${rowPy} pr-2 text-right ${rowTextPrice} font-bold text-[var(--color-text)] print:text-black`}>
                {item.price.toLocaleString(undefined, { minimumFractionDigits: 3 })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-[1.5px] border-slate-900 print:border-black">
            <td className="pt-4 pb-2 pl-2 text-[11px] font-black uppercase tracking-[0.1em] text-[var(--color-text)] print:text-black">
              Total Net à Payer
            </td>
            <td className="pt-4 pb-2 pr-2 text-right">
              <span className="text-2xl font-black text-[var(--color-text)] print:text-black">
                {finalTotal?.toLocaleString(undefined, { minimumFractionDigits: 3 })}
              </span>
              <span className="text-[12px] ml-1.5 font-bold text-slate-500 print:text-black/60">{AMOUNT_UNIT}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

