'use client';

import React from 'react';
import type { AnalysisPrintProps } from '@/components/print/types';
import { InvoiceHeader } from '@/components/print/InvoiceHeader';
import { PatientInvoiceSection } from '@/components/print/PatientInvoiceSection';
import { InvoiceTable } from '@/components/print/InvoiceTable';
import { InvoiceFooter } from '@/components/print/InvoiceFooter';

export const FactureImpression: React.FC<AnalysisPrintProps> = ({ analysis, settings }) => {
    return (
        <div className="bg-[var(--color-surface)] p-10 text-[var(--color-text)] font-sans w-[210mm] mx-auto relative print:p-0 print:text-black leading-relaxed">
            <InvoiceHeader analysis={analysis} settings={settings} />
            <PatientInvoiceSection analysis={analysis} settings={settings} />
            <InvoiceTable results={analysis.results} totalPrice={analysis.totalPrice} settings={settings} />
            <InvoiceFooter analysis={analysis} settings={settings} />

            <style jsx global>{`
                .break-inside-avoid {
                    break-inside: avoid;
                }
                
                @media print {
                    @page {
                        margin: 12mm 10mm;
                        size: A4;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        counter-reset: page;
                    }
                    table {
                      page-break-inside: auto;
                    }
                    tr {
                      page-break-inside: avoid;
                      page-break-after: auto;
                    }
                    .footer-content {
                      break-inside: avoid;
                    }
                    .page-number::after {
                        counter-increment: page;
                        content: counter(page);
                    }
                }
            `}</style>
        </div>
    );
};
