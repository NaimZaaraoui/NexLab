import React from 'react';
import { LucideMicroscope } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { resolvePrintBranding } from '@/lib/documents/report-generation';
import type { PrintSettings } from '@/components/print/types';

interface PrintDocHeaderProps {
  settings?: PrintSettings;
  docTitle: string;
  docRef?: string;
  docAccent?: string;
  qrValue?: string;
  infoLabel?: string;
  infoTitle?: string;
  infoChips?: React.ReactNode;
  metaCells?: { label: string; value: string }[];
}

export function PrintDocHeader({
  settings,
  docTitle,
  docRef,
  docAccent,
  qrValue,
  infoLabel,
  infoTitle,
  infoChips,
  metaCells = [],
}: PrintDocHeaderProps) {
  const { LAB_NAME, LAB_SUBTITLE, LAB_LOGO, SHOW_BARCODE } = resolvePrintBranding(settings);
  const showQr = SHOW_BARCODE && !!qrValue;

  return (
    <>
      <div className="flex justify-between items-center mb-2 relative z-10 px-4 pt-4">
        <div className="flex items-center gap-3">
          {LAB_LOGO ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={LAB_LOGO} alt={LAB_NAME} className="h-10 w-auto max-w-[100px] object-contain print:grayscale-0" />
          ) : (
            <div className="p-1.5 bg-black">
              <LucideMicroscope size={28} className="text-white" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight uppercase print:text-black leading-none">
              {LAB_NAME}
            </h1>
            <div className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.1em] mt-1 flex items-center gap-2 print:text-black/70">
              <span className="w-5 h-[2px] bg-indigo-600 print:bg-black shrink-0" />
              {LAB_SUBTITLE}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pr-2">
          <div className="text-right">
            <h2 className="text-xl font-black text-[var(--color-text)] uppercase tracking-tight mb-0.5 print:text-black">
              {docTitle}
            </h2>
            {docRef && (
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em] print:text-black/60">
                {docRef}
              </p>
            )}
            {docAccent && (
              <p className="text-[11px] font-bold text-[var(--color-accent)] uppercase tracking-[0.08em] print:text-black">
                {docAccent}
              </p>
            )}
          </div>
          {showQr && (
            <div className="p-1 bg-white border border-slate-200 shadow-sm print:border-black/20 print:shadow-none shrink-0 mix-blend-multiply">
              <QRCodeSVG value={qrValue!} size={48} level="M" />
            </div>
          )}
        </div>
      </div>

      {(infoLabel || infoTitle || metaCells.length > 0) && (
        <div className="grid grid-cols-12 gap-3 mb-3 relative z-10 px-4">
          <div className="col-span-12 h-px bg-[var(--color-surface-muted)] print:bg-black/20" />
          {(infoLabel || infoTitle) && (
            <div className="col-span-5 py-1">
              {infoLabel && (
                <span className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-[0.1em] print:text-black">
                  {infoLabel}
                </span>
              )}
              {infoTitle && (
                <h3 className="text-xl font-black text-[var(--color-text)] print:text-black leading-tight mt-1">
                  {infoTitle}
                </h3>
              )}
              {infoChips && (
                <div className="flex flex-wrap gap-3 text-[12px] font-medium text-[var(--color-text-secondary)] print:text-black mt-0.5">
                  {infoChips}
                </div>
              )}
            </div>
          )}
          {metaCells.length > 0 && (
            <div className={`${infoTitle ? 'col-span-7 pl-6 border-l border-[var(--color-border)] print:border-black/20' : 'col-span-12'} grid grid-cols-2 gap-x-4 gap-y-1 py-1`}>
              {metaCells.map(({ label, value }) => (
                <div key={label}>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.08em] print:text-black/60">
                    {label}
                  </span>
                  <p className="text-[12px] font-bold text-[var(--color-text)] print:text-black leading-tight mt-0.5">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="col-span-12 h-px bg-[var(--color-surface-muted)] print:bg-black/20" />
        </div>
      )}
    </>
  );
}
