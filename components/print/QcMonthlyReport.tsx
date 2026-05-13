import React, { forwardRef, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LeveyJenningsChart } from '../qc/LeveyJenningsChart';
import { resolvePrintBranding } from '@/lib/report-generation';
import type { PrintSettings } from '@/components/print/types';
import { LucideMicroscope } from 'lucide-react';

type QcReportTarget = {
  id: string;
  testCode: string;
  testName: string;
  controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
  mean: number;
  sd: number | null;
  minAcceptable: number | null;
  maxAcceptable: number | null;
  unit: string | null;
};

type QcReportValue = {
  id: string;
  testCode: string;
  measured: number;
  zScore: number | null;
  controlMode?: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
  minAcceptable?: number | null;
  maxAcceptable?: number | null;
  inAcceptanceRange?: boolean | null;
  flag: string;
  rule?: string | null;
};

type QcReportResult = {
  id: string;
  performedAt: string;
  performedByName: string | null;
  values: QcReportValue[];
};

type QcReportPoint = {
  id: string;
  performedAt: string;
  performedByName: string;
  measured: number;
  zScore: number | null;
  controlMode: 'STATISTICAL' | 'ACCEPTANCE_RANGE';
  minAcceptable: number | null;
  maxAcceptable: number | null;
  inAcceptanceRange: boolean | null;
  flag: string;
  rule: string | null;
};

type QcReportLot = {
  lotNumber: string;
  material: {
    name: string;
    level: string;
  };
  targets: QcReportTarget[];
  results: QcReportResult[];
};

interface QcMonthlyReportProps {
  lot: QcReportLot;
  settings?: PrintSettings;
  month?: Date;
  selectedTestCode?: string | null;
}

export const QcMonthlyReport = forwardRef<HTMLDivElement, QcMonthlyReportProps>(
  ({ lot, settings, month = new Date(), selectedTestCode }, ref) => {
    const {
      LAB_NAME,
      LAB_SUBTITLE,
      LAB_ADDRESS,
      LAB_PHONE,
      BIO_TITLE,
      BIO_NAME,
      BIO_ONMPT,
      FOOTER_TEXT,
    } = resolvePrintBranding(settings);

    const targetMonth = format(month, 'MMMM yyyy', { locale: fr });
    const printDate = format(new Date(), 'dd MMMM yyyy', { locale: fr });

    const selectedTarget = useMemo(() => {
      if (!lot?.targets?.length) return null;
      if (selectedTestCode) {
        const explicit = lot.targets.find((target: QcReportTarget) => target.testCode === selectedTestCode);
        if (explicit) return explicit;
      }
      return lot.targets[0] ?? null;
    }, [lot?.targets, selectedTestCode]);

    const selectedPoints = useMemo(() => {
      if (!selectedTarget) return [];

      return lot.results
        .map((result) => {
          const value = result.values.find((entry) => entry.testCode === selectedTarget.testCode);
          if (!value) return null;

          const point: QcReportPoint = {
            id: value.id,
            performedAt: result.performedAt,
            performedByName: result.performedByName || 'Utilisateur',
            measured: value.measured,
            zScore: value.zScore,
            controlMode: value.controlMode ?? selectedTarget.controlMode,
            minAcceptable: value.minAcceptable ?? selectedTarget.minAcceptable,
            maxAcceptable: value.maxAcceptable ?? selectedTarget.maxAcceptable,
            inAcceptanceRange: value.inAcceptanceRange ?? null,
            flag: value.flag,
            rule: value.rule ?? null,
          };
          return point;
        })
        .filter((point): point is QcReportPoint => point !== null);
    }, [lot.results, selectedTarget]);

    if (!selectedTarget) {
      return null;
    }

    const lotDescriptor = `${lot.material.name} · LOT ${lot.lotNumber}`;

    const renderHeader = () => (
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
                    {selectedTarget.testCode} · {selectedTarget.testName}
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
                  <h3 className="text-2xl font-black text-[var(--color-text)] mb-2 print:text-black">{lot.material.name}</h3>
                  <div className="flex gap-4 text-sm font-medium text-[var(--color-text-soft)] print:text-black">
                    <span>Lot {lot.lotNumber}</span>
                    <span className="text-slate-200 print:text-black/30">|</span>
                    <span>Niveau {lot.material.level}</span>
                  </div>
                </div>
              </div>

              <div className="col-span-8 grid grid-cols-2 gap-4 pl-8 border-l border-[var(--color-border)] print:border-black/10">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black/60">
                    Test surveillé
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">
                    {selectedTarget.testName} ({selectedTarget.testCode})
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black/60">
                    Édition
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">{printDate}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black/60">
                    Cible
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">
                    {selectedTarget.mean.toFixed(2)} {selectedTarget.unit || ''}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black/60">
                    Laboratoire
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">
                    {LAB_NAME}
                    {LAB_ADDRESS ? ` — ${LAB_ADDRESS}` : ''}
                  </p>
                </div>
              </div>
              <div className="col-span-12 h-px bg-[var(--color-surface-muted)] print:bg-black/10"></div>
            </div>
          </td>
        </tr>
      </thead>
    );

    const renderFooter = () => (
      <tfoot className="display-table-footer-group">
        <tr>
          <td>
            <div className="pt-6 border-t-2 border-slate-900 print:border-black footer-content px-4">
              <div className="grid grid-cols-3 gap-12">
                <div className="col-span-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 print:text-black">
                    Validation qualité
                  </h4>
                  <p className="text-xs text-[var(--color-text-soft)] leading-relaxed max-w-md print:text-black">
                    Revue mensuelle du contrôle qualité interne pour {lotDescriptor}. Ce rapport doit être
                    interprété avec les procédures QC du laboratoire et les règles internes de validation.
                  </p>
                  <div className="mt-6 flex gap-8">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-300 uppercase print:text-black/40">Lot</span>
                      <span className="text-[11px] font-bold text-[var(--color-text)] print:text-black">{lot.lotNumber}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-300 uppercase print:text-black/40">Test</span>
                      <span className="text-[11px] font-bold text-[var(--color-text)] print:text-black">{selectedTarget.testCode}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-full border-b border-slate-900 pb-2 mb-4 text-center print:border-black">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] print:text-black">
                      Signature & Cachet
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div style={{ position: 'relative', width: '120px', height: '90px', margin: '0 auto' }}>
                      {settings?.lab_stamp_image && settings?.lab_bio_signature && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={settings.lab_stamp_image}
                            alt="Cachet"
                            style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '90px', height: '90px', objectFit: 'contain', opacity: 0.9 }}
                          />
                          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '130px', height: '30px', backgroundColor: 'hsla(0, 0%, 100%, 0.5)', paddingBottom: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={settings.lab_bio_signature}
                              alt="Signature"
                              style={{ width: '120px', height: '30px', objectFit: 'contain', objectPosition: 'center bottom', filter: 'contrast(1.15)' }}
                            />
                          </div>
                        </>
                      )}

                      {settings?.lab_stamp_image && !settings?.lab_bio_signature && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={settings.lab_stamp_image} alt="Cachet" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90px', height: '90px', objectFit: 'contain' }} />
                        </>
                      )}

                      {!settings?.lab_stamp_image && settings?.lab_bio_signature && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={settings.lab_bio_signature} alt="Signature" style={{ width: '130px', height: '30px', objectFit: 'contain', objectPosition: 'center bottom', filter: 'contrast(1.15)' }} />
                          <div style={{ width: '120px', height: '90px', border: '1px dashed #cfd2d7ff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                            <span style={{ fontSize: '7px', color: '#cfd2d7ff', textAlign: 'center', lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: '0.1em', transform: 'rotate(-15deg)' }}>Zone de cachet</span>
                          </div>
                        </div>
                      )}

                      {!settings?.lab_stamp_image && !settings?.lab_bio_signature && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '90px', border: '2px dashed #cfd2d7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                          <span style={{ fontSize: '8px', color: '#cfd2d7ff', textAlign: 'center', lineHeight: 1.6, textTransform: 'uppercase', letterSpacing: '0.15em', transform: 'rotate(-15deg)' }}>Zone de cachet</span>
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest print:text-black">
                        {BIO_TITLE && BIO_NAME ? `${BIO_TITLE} ${BIO_NAME}` : 'Biologiste Responsable'}
                      </p>
                      {BIO_ONMPT && (
                        <p className="text-[8px] font-bold text-slate-400 print:text-black/60 mt-0.5">
                          ONMPT: {BIO_ONMPT}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {FOOTER_TEXT && (
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '8px', fontSize: '9px', color: '#94a3b8', textAlign: 'center' }}>
                  {FOOTER_TEXT}
                </div>
              )}
              <div className="mt-6 flex justify-between items-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] border-t border-[var(--color-border)] pt-8 print:border-black print:text-black">
                <span>{LAB_NAME}</span>
                <div className="flex gap-4">
                  {LAB_PHONE && <span>Tél: {LAB_PHONE}</span>}
                </div>
                <span className="text-[var(--color-text)] print:text-black">QC</span>
              </div>
            </div>
          </td>
        </tr>
      </tfoot>
    );

    return (
      <div
        ref={ref}
        className="bg-[var(--color-surface)] font-sans text-[var(--color-text)] w-[210mm] mx-auto relative leading-relaxed print:p-0 print:text-black"
      >
        <div className="absolute top-0 right-0 w-1/3 h-1 bg-slate-900 print:bg-black"></div>
        <div className="absolute top-0 left-0 w-12 h-1 bg-indigo-600 print:bg-black"></div>

        {/* PAGE 1: Graphique */}
        <div className="print:break-after-page mb-8 print:mb-0">
          <table className="w-full border-collapse border-none">
            {renderHeader()}
            <tbody>
              <tr>
                <td>
                  <div className="px-4 pb-4">
                    <div className="bg-[var(--color-surface)] p-4 items-center flex justify-center">
                      <LeveyJenningsChart
                        title=""
                        points={selectedPoints}
                        mean={selectedTarget.mean}
                        sd={selectedTarget.sd}
                        unit={selectedTarget.unit}
                        controlMode={selectedTarget.controlMode}
                        minAcceptable={selectedTarget.minAcceptable}
                        maxAcceptable={selectedTarget.maxAcceptable}
                        printWidth={680}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
            {renderFooter()}
          </table>
        </div>

        {/* PAGE 2: Registre */}
        {selectedPoints.length > 0 && (
          <div>
            <table className="w-full border-collapse border-none">
              {renderHeader()}
              <tbody>
                <tr>
                  <td>
                    <div className="px-8 pb-4 pt-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text)] mb-4 print:text-black">
                        Registre des mesures ({selectedPoints.length} derniers points)
                      </h3>
                      <table className="w-full text-left text-[11px] border-collapse relative z-10">
                        <thead>
                          <tr className="border-b border-slate-900 print:border-black text-[9px] uppercase tracking-widest text-slate-400 print:text-black/60">
                            <th className="py-2 pr-4 font-black">Date</th>
                            <th className="py-2 pr-4 font-black">Valeur</th>
                            <th className="py-2 pr-4 font-black">Statut</th>
                            <th className="py-2 pr-4 font-black">Règle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-black/10">
                          {[...selectedPoints]
                            .reverse() /* Afficher du plus vieux au plus récent */
                            .map((point) => (
                            <tr key={point.id}>
                              <td className="py-2 pr-4 text-[var(--color-text-secondary)] print:text-black/80 font-medium">
                                {format(new Date(point.performedAt), 'dd/MM/yyyy HH:mm')}
                              </td>
                              <td className="py-2 pr-4 font-bold text-[var(--color-text)] print:text-black">
                                {point.measured} {selectedTarget.unit || ''}
                              </td>
                              <td className="py-2 pr-4">
                                {point.controlMode === 'STATISTICAL' ? (
                                   <span className="text-[var(--color-text-secondary)] print:text-black/80 text-[11px] font-mono font-medium">Z: {point.zScore?.toFixed(2) ?? '—'}</span>
                                ) : (
                                   <span className="text-[var(--color-text-secondary)] print:text-black/80 text-[11px] font-medium">{point.inAcceptanceRange ? 'Conforme' : 'Alerte'}</span>
                                )}
                              </td>
                              <td className="py-2 pr-4 text-[11px] font-bold print:text-black">
                                {point.rule ? (
                                  <span className="text-rose-500 print:text-black">{point.rule}</span>
                                ) : (
                                  <span className="text-slate-300 print:text-black/30">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </tbody>
              {renderFooter()}
            </table>
          </div>
        )}

        <style jsx global>{`
          @media print {
            @page {
              margin: 12mm 10mm;
              size: A4;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
          }
        `}</style>
      </div>
    );
  }
);

QcMonthlyReport.displayName = 'QcMonthlyReport';
