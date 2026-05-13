import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { resolvePrintBranding } from '@/lib/report-generation';
import { isAnalysisValidated } from '@/lib/status-flow';
import type { Analysis } from '@/lib/types';
import type { PrintSettings } from '@/components/print/types';
import type { AnalysisStatus } from '@/lib/status-flow';

interface Props {
  analysis: Analysis;
  settings?: PrintSettings;
  showFull?: boolean;
}

export function ReportFooterSignature({ analysis, settings, showFull = true }: Props) {
  const { LAB_NAME, LAB_PHONE, BIO_TITLE, BIO_NAME, BIO_ONMPT, FOOTER_TEXT, REPORT_DISCLAIMER } = resolvePrintBranding(settings);
  const isValidated = isAnalysisValidated(analysis.status as AnalysisStatus);

  return (
    <tfoot className="display-table-footer-group">
      <tr>
        <td>
          {showFull ? (
            <div className="pt-6 border-t-2 border-slate-900 print:border-black footer-content">
              <div className="grid grid-cols-3 gap-12">
                <div className="col-span-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 print:text-black">Notes du Biologiste</h4>
                  <p className="text-xs text-[var(--color-text-soft)] leading-relaxed max-w-md print:text-black">
                    {REPORT_DISCLAIMER}<br />
                    <span className="text-[8px] font-black text-slate-300 uppercase print:text-black/60">↑ = Résultat élevé | ↓ = Résultat bas | Préc. = Dernier résultat validé dans notre laboratoire</span>
                  </p>
                  <div className="mt-6 flex gap-8">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-300 uppercase print:text-black/60">ID Document</span>
                      <span className="text-[11px] font-bold text-[var(--color-text)] print:text-black">{analysis.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-300 uppercase print:text-black/60">Statut</span>
                      <span className={`text-[11px] font-black uppercase ${isValidated ? 'text-[var(--color-accent)]' : 'text-amber-600'} print:text-black`}>
                        {isValidated ? 'Validé' : 'En attente'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-full border-b border-slate-900 pb-2 mb-4 text-center print:border-black">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] print:text-black">Signature & Cachet</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-full">
                    {analysis.validatedBioAt && (
                      <div className="text-[9px] text-[var(--color-text-secondary)] font-medium text-center print:text-black">
                        Validé le {format(new Date(analysis.validatedBioAt), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}
                      </div>
                    )}
                    
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
          ) : (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] print:border-black/10 footer-content">
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] print:text-black">
                <span>{LAB_NAME} - Rapport</span>
                <div className="flex gap-8 items-center">
                  <span className="text-[var(--color-accent)] font-black">Validé par le Biologiste Responsable</span>
                  <span className="text-[var(--color-text)] print:text-black page-number-container">
                    Page <span className="page-number"></span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </td>
      </tr>
    </tfoot>
  );
}
