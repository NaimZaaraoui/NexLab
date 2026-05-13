'use client';

import React, { forwardRef, useEffect } from 'react';
import { format, getDaysInMonth, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LucideMicroscope } from 'lucide-react';
import { TemperatureHistoryChart } from '../temperature/TemperatureHistoryChart';

type TemperatureReading = {
  id: string;
  value: number;
  period: 'matin' | 'soir';
  recordedAt: string;
  measuredAt: string;
  isOutOfRange: boolean;
  correctiveAction?: string | null;
  recordedBy?: string;
};

type Instrument = {
  id: string;
  name: string;
  type: string;
  unit: string;
  targetMin: number;
  targetMax: number;
  location?: string | null;
};

interface TemperatureMonthlyReportProps {
  instrument: Instrument;
  readings: TemperatureReading[];
  month: string;
  settings?: Record<string, string>;
}

export const TemperatureMonthlyReport = forwardRef<HTMLDivElement, TemperatureMonthlyReportProps>(
  ({ instrument, readings, month, settings }, ref) => {
    useEffect(() => {
      // Auto-trigger print after a short delay to ensure rendering is complete
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }, []);

    const LAB_NAME = settings?.lab_name || 'Laboratoire';
    const LAB_SUBTITLE = settings?.lab_subtitle || 'Service de Laboratoire';
    const LAB_ADDRESS = [settings?.lab_address_1, settings?.lab_address_2].filter(Boolean).join(', ');
    const LAB_PHONE = settings?.lab_phone || '';
    const BIO_TITLE = settings?.lab_bio_title || 'Docteur';
    const BIO_NAME = settings?.lab_bio_name || '';
    const BIO_ONMPT = settings?.lab_bio_onmpt || '';
    const BIO_SIGNATURE = settings?.lab_signature || settings?.lab_bio_signature;
    const LAB_STAMP_IMAGE = settings?.lab_stamp_image;
    const FOOTER_TEXT = settings?.lab_footer_text || '';

    const printDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
    const targetMonth = format(new Date(month + '-01'), 'MMMM yyyy', { locale: fr });

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
                    {LAB_SUBTITLE.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="text-right pr-6">
                <h2 className="text-2xl font-black text-[var(--color-text)] uppercase tracking-tight mb-1 print:text-black">SUIVI TEMPÉRATURE</h2>
                <div className="flex flex-col items-end">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest print:text-black/60">Période: {targetMonth}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mb-8 relative z-10 px-4">
              <div className="col-span-12 h-px bg-[var(--color-surface-muted)] print:bg-black/10"></div>
              <div className="col-span-4">
                <span className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest print:text-black">Équipement</span>
                <div className="flex flex-col mt-2">
                  <h3 className="text-2xl font-black text-[var(--color-text)] mb-2 print:text-black">{instrument.name}</h3>
                  <div className="flex gap-4 text-sm font-medium text-[var(--color-text-soft)] print:text-black">
                    <span>{instrument.type}</span>
                    <span className="text-slate-200 print:text-black/30">|</span>
                    <span>{instrument.location || 'Localisation non spécifiée'}</span>
                  </div>
                </div>
              </div>

              <div className="col-span-8 grid grid-cols-2 gap-4 pl-8 border-l border-[var(--color-border)] print:border-black/10">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black/60">Période</span>
                  <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">{targetMonth}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black/60">Édition</span>
                  <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">{printDate}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest print:text-black/60">Établissement</span>
                  <p className="text-sm font-bold text-[var(--color-text)] mt-1 print:text-black">{LAB_NAME}{LAB_ADDRESS ? ` — ${LAB_ADDRESS}` : ''}</p>
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
            <div className="pt-6 border-t-2 border-slate-900 print:border-black mt-12 footer-content px-4">
              <div className="grid grid-cols-3 gap-12">
                <div className="col-span-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 print:text-black">Validation Biologiste</h4>
                  <p className="text-xs text-[var(--color-text-soft)] leading-relaxed max-w-md print:text-black">
                    Revue effectuée conformément aux procédures d&apos;assurance qualité du laboratoire.
                    Les écarts hors plage font l&apos;objet d&apos;actions correctives documentées.<br />
                    <span className="text-[8px] font-black text-slate-300 uppercase print:text-black/40 italic mt-2 block tracking-wider">Document généré le {printDate}</span>
                  </p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-full border-b border-slate-900 pb-2 mb-4 text-center print:border-black">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] print:text-black">Signature & Cachet</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div style={{ position: 'relative', width: '120px', height: '90px', margin: '0 auto' }}>
                      {LAB_STAMP_IMAGE && BIO_SIGNATURE && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={LAB_STAMP_IMAGE}
                            alt="Cachet"
                            style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '90px', height: '90px', objectFit: 'contain', opacity: 0.9 }}
                          />
                          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '130px', height: '30px', backgroundColor: 'hsla(0, 0%, 100%, 0.5)', paddingBottom: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={BIO_SIGNATURE}
                              alt="Signature"
                              style={{ width: '120px', height: '30px', objectFit: 'contain', objectPosition: 'center bottom', filter: 'contrast(1.15)' }}
                            />
                          </div>
                        </>
                      )}

                      {LAB_STAMP_IMAGE && !BIO_SIGNATURE && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={LAB_STAMP_IMAGE} alt="Cachet" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90px', height: '90px', objectFit: 'contain' }} />
                        </>
                      )}

                      {!LAB_STAMP_IMAGE && BIO_SIGNATURE && (
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={BIO_SIGNATURE} alt="Signature" style={{ width: '130px', height: '30px', objectFit: 'contain', objectPosition: 'center bottom', filter: 'contrast(1.15)' }} />
                          <div style={{ width: '120px', height: '90px', border: '1px dashed #cfd2d7ff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                            <span style={{ fontSize: '7px', color: '#cfd2d7ff', textAlign: 'center', lineHeight: 1.5, textTransform: 'uppercase', letterSpacing: '0.1em', transform: 'rotate(-15deg)' }}>Zone de cachet</span>
                          </div>
                        </div>
                      )}

                      {!LAB_STAMP_IMAGE && !BIO_SIGNATURE && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '90px', border: '2px dashed #cfd2d7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                          <span style={{ fontSize: '8px', color: '#cfd2d7ff', textAlign: 'center', lineHeight: 1.6, textTransform: 'uppercase', letterSpacing: '0.15em', transform: 'rotate(-15deg)' }}>Zone de cachet</span>
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-widest print:text-black">
                        {BIO_TITLE && BIO_NAME ? `${BIO_TITLE} ${BIO_NAME}` : 'Biologiste Responsable'}
                      </p>
                      {BIO_ONMPT && <p className="text-[8px] font-bold text-slate-400 print:text-black/60 mt-0.5">ONMPT: {BIO_ONMPT}</p>}
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
                <span className="text-[var(--color-text)] print:text-black page-number-container">
                  Page <span className="page-number"></span>
                </span>
              </div>
            </div>
          </td>
        </tr>
      </tfoot>
    );

    const renderChart = () => {
      if (readings.length === 0) return null;

      return (
        <div className="break-inside-avoid">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-xs font-black text-[var(--color-accent)] uppercase tracking-[0.4em] print:text-black">Graphique de tendance</span>
            <div className="h-[1px] flex-1 bg-[var(--color-surface-muted)] print:bg-black/5"></div>
            <div className="flex gap-4 text-[10px] font-bold text-slate-400">
               <span>Zone: {instrument.targetMin} - {instrument.targetMax}{instrument.unit}</span>
            </div>
          </div>
          
          <div className="bg-[var(--color-surface)]">
            <TemperatureHistoryChart
              readings={readings}
              min={instrument.targetMin}
              max={instrument.targetMax}
              unit={instrument.unit}
              printWidth={700}
            />
          </div>
        </div>
      );
    };

    return (
      <div ref={ref} className="bg-[var(--color-surface)] p-10 text-[var(--color-text)] font-sans w-[210mm] mx-auto relative print:p-0 print:text-black leading-relaxed">
        <div className="absolute top-0 right-0 w-1/3 h-1 bg-slate-900 print:bg-black"></div>
        <div className="absolute top-0 left-0 w-12 h-1 bg-indigo-600 print:bg-black"></div>

        {/* PAGE 1: Graphique */}
        <div className="print:break-after-page mb-8 print:mb-0">
          <table className="w-full border-collapse border-none">
            {renderHeader()}
            <tbody>
              <tr>
                <td>
                  <div className="py-6">
                    {renderChart()}
                  </div>
                </td>
              </tr>
            </tbody>
            {renderFooter()}
          </table>
        </div>

        {/* PAGE 2: Data Registry */}
        {readings.length > 0 && (
          <div>
            <table className="w-full border-collapse border-none">
              <tbody>
                <tr>
                  <td>
                    <div className="px-8 pb-2 pt-4">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-text)] mb-2 print:text-black">
                        Registre journalier - {targetMonth}
                      </h3>
                      <table className="w-full text-left text-[11px] border-collapse relative z-10">
                        <thead>
                          <tr className="border-b border-slate-900 print:border-black text-[9px] uppercase tracking-widest text-slate-400 print:text-black/60">
                            <th className="py-1 pr-4 font-black">Jour</th>
                            <th className="py-1 pr-4 font-black">Matin</th>
                            <th className="py-1 pr-4 font-black">Soir</th>
                            <th className="py-1 pr-4 font-black">Statut</th>
                            <th className="py-1 pr-4 font-black">Action Corrective</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 print:divide-black/10">
                          {Array.from({ length: getDaysInMonth(parseISO(`${month}-01`)) }, (_, i) => i + 1).map((day) => {
                            const dayString = `${month}-${day.toString().padStart(2, '0')}`;
                            const matin = readings.find(r => r.recordedAt.startsWith(dayString) && r.period === 'matin');
                            const soir = readings.find(r => r.recordedAt.startsWith(dayString) && r.period === 'soir');
                            const isOut = matin?.isOutOfRange || soir?.isOutOfRange;
                            const action = matin?.correctiveAction || soir?.correctiveAction;
                            
                            return (
                              <tr key={day}>
                                <td className="py-[3px] pr-4 text-[var(--color-text-secondary)] print:text-black/80 font-bold whitespace-nowrap">
                                  {day.toString().padStart(2, '0')}
                                </td>
                                <td className="py-[3px] pr-4 font-bold text-[var(--color-text)] print:text-black whitespace-nowrap">
                                  {matin ? `${matin.value.toFixed(1)} ${instrument.unit}` : <span className="text-slate-300 print:text-black/30">—</span>}
                                </td>
                                <td className="py-[3px] pr-4 font-bold text-[var(--color-text)] print:text-black whitespace-nowrap">
                                  {soir ? `${soir.value.toFixed(1)} ${instrument.unit}` : <span className="text-slate-300 print:text-black/30">—</span>}
                                </td>
                                <td className="py-[3px] pr-4 font-bold whitespace-nowrap">
                                  {!matin && !soir ? (
                                    <span className="text-slate-300 print:text-black/30">—</span>
                                  ) : isOut ? (
                                    <span className="text-rose-500 print:text-black">Hors Norme</span>
                                  ) : (
                                    <span className="text-emerald-600 print:text-black">Conforme</span>
                                  )}
                                </td>
                                <td className="py-[3px] pr-4 italic">
                                  {action ? (
                                    <span className="text-slate-700 print:text-black font-medium text-[10px]">{action}</span>
                                  ) : (
                                    <span className="text-slate-300 print:text-black/30">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
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
          .break-inside-avoid {
            break-inside: avoid;
          }
          @media print {
            @page {
              margin: 12mm 10mm;
              size: A4;
              width: 189mm;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              counter-reset: page;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
            .page-number::after {
              counter-increment: page;
              content: counter(page);
            }
            tr {
              break-inside: avoid;
            }
          }
        `}</style>
      </div>
    );
  }
);

TemperatureMonthlyReport.displayName = 'TemperatureMonthlyReport';
