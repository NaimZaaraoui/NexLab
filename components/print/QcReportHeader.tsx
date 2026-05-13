import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LucideMicroscope } from 'lucide-react';
import { resolvePrintBranding } from '@/lib/report-generation';
import type { PrintSettings } from '@/components/print/types';

interface QcReportHeaderProps {
  lotNumber: string;
  materialName: string;
  materialLevel: string;
  testCode: string;
  testName: string;
  targetMean: number;
  targetSd: number | null;
  targetUnit: string | null;
  month: Date;
  settings?: PrintSettings;
}

/**
 * QcReportHeader - Renders the header section of QC monthly report
 * 
 * Includes:
 * - Laboratory branding
 * - QC report title and period
 * - Lot and test information
 * - Control targets (mean, SD)
 * - Decorative header bars
 * 
 * @param lotNumber - QC lot identifier
 * @param materialName - Material/reagent name
 * @param materialLevel - Control level
 * @param testCode - Test code/abbreviation
 * @param testName - Full test name
 * @param targetMean - Statistical mean for this control
 * @param targetSd - Standard deviation (if statistical mode)
 * @param targetUnit - Measurement unit
 * @param month - Month being reported on
 * @param settings - Print settings with lab branding
 */
export const QcReportHeader: React.FC<QcReportHeaderProps> = ({
  lotNumber,
  materialName,
  materialLevel,
  testCode,
  testName,
  targetMean,
  targetSd,
  targetUnit,
  month,
  settings,
}) => {
  const { LAB_NAME, LAB_SUBTITLE } = resolvePrintBranding(settings);
  const targetMonth = format(month, 'MMMM yyyy', { locale: fr });

  return (
    <thead className="display-table-header-group">
      <tr>
        <td>
          <div className="flex justify-between items-end mb-4 relative z-10 pt-4 px-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-black rounded-xl">
                <LucideMicroscope size={40} className="text-white" />
              </div>
              <div className="flex flex-col ml-2">
                <h1 className="text-4xl font-black text-[var(--color-text)] tracking-tight uppercase print:text-black leading-none">
                  {LAB_NAME}
                </h1>
                <div className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest mt-2 flex items-center gap-2">
                  <span className="w-6 h-[2px] bg-indigo-600 print:bg-black"></span>
                  {LAB_SUBTITLE}
                </div>
              </div>
            </div>

            <div className="text-right pr-6">
              <h2 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-tight mb-1 print:text-black">
                RAPPORT QC
              </h2>
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-black/60">
                  Période: {targetMonth}
                </p>
                <p className="text-[10px] font-bold text-[var(--color-accent)] uppercase tracking-widest print:text-black">
                  {testCode} · {testName}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 mb-8 relative z-10 px-4">
            <div className="col-span-12 h-px bg-[var(--color-surface-muted)] print:bg-black/10"></div>
            <div className="col-span-4">
              <span className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest print:text-black">
                Lot QC
              </span>
              <div className="flex flex-col mt-2">
                <h3 className="text-2xl font-black text-[var(--color-text)] mb-2 print:text-black">{materialName}</h3>
                <div className="flex gap-4 text-sm font-medium text-[var(--color-text-soft)] print:text-black">
                  <span>Lot {lotNumber}</span>
                  <span className="text-slate-200 print:text-black/30">|</span>
                  <span>Niveau {materialLevel}</span>
                </div>
              </div>
            </div>

            <div className="col-span-8 grid grid-cols-2 gap-4 pl-8 border-l border-[var(--color-border)] print:border-black/10">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black/60">
                  Test surveillé
                </span>
                <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">
                  {testName} ({testCode})
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black/60">
                  Cible
                </span>
                <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">
                  {targetMean.toFixed(2)} {targetUnit || ''}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black/60">
                  Écart-type (SD)
                </span>
                <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">
                  {targetSd ? targetSd.toFixed(3) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </thead>
  );
};
