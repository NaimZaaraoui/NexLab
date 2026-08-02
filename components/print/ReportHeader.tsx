import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LucideMicroscope, Phone, Mail } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { resolvePrintBranding } from '@/lib/documents/report-generation';
import type { Analysis } from '@/lib/core/types';
import type { PrintSettings } from '@/components/print/types';

interface Props {
  analysis: Analysis;
  settings?: PrintSettings;
}

export function ReportHeader({ analysis, settings }: Props) {
  const { LAB_NAME, LAB_SUBTITLE, LAB_ADDRESS, LAB_PHONE, LAB_EMAIL, LAB_LOGO, REPORT_TITLE, SHOW_DOCTOR, SHOW_BARCODE, SHOW_PROVENANCE } = resolvePrintBranding(settings);

  const patientName = `${analysis.patient?.firstName || ''} ${analysis.patient?.lastName || ''}`.trim() || 'PATIENT SANS NOM';
  const age = analysis.patient?.birthDate
    ? Math.floor((new Date().getTime() - new Date(analysis.patient.birthDate).getTime()) / 31557600000)
    : null;
  const dateEdition = format(new Date(), 'dd MMMM yyyy', { locale: fr });
  const datePrelevement = format(new Date(analysis.creationDate), 'dd MMMM yyyy', { locale: fr });

  return (
    <thead className="display-table-header-group">
      <tr>
        <td>
          {/* ── TOP BAR : Lab identity + Report title ── */}
          <div className="flex justify-between items-center mb-2 relative z-10 px-4 pt-4">
            {/* Logo + lab name */}
            <div className="flex items-center gap-3">
              {LAB_LOGO ? (
                <img
                  src={LAB_LOGO}
                  alt={LAB_NAME}
                  className="h-10 w-auto max-w-[100px] object-contain print:grayscale-0"
                />
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

            {/* Report title + QR */}
            <div className="flex items-center gap-4 pr-2">
              <div className="text-right">
                <h2 className="text-xl font-black text-[var(--color-text)] uppercase tracking-tight mb-0.5 print:text-black">{REPORT_TITLE}</h2>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Réf: {analysis.orderNumber}</p>
                {analysis.receiptNumber && (
                  <p className="text-[11px] font-bold text-[var(--color-accent)] uppercase tracking-[0.08em] print:text-black">Quittance: {analysis.receiptNumber}</p>
                )}
              </div>
              {SHOW_BARCODE && (
                <div className="p-1 bg-white border border-slate-200 shadow-sm print:border-black/20 print:shadow-none shrink-0 mix-blend-multiply">
                  <QRCodeSVG value={analysis.orderNumber.trim()} size={48} level="M" />
                </div>
              )}
            </div>
          </div>

          {/* ── PATIENT INFO BAND ── */}
          <div className="grid grid-cols-12 gap-3 mb-3 relative z-10 px-4">
            <div className="col-span-12 h-px bg-[var(--color-surface-muted)] print:bg-black/20" />
            {/* Patient identity */}
            <div className="col-span-5 py-1">
              <span className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-[0.1em] print:text-black">Patient</span>
              <div className="flex flex-col mt-1">
                <h3 className="text-xl font-black text-[var(--color-text)] print:text-black leading-tight">{patientName}</h3>
                <div className="flex flex-wrap gap-3 text-[12px] font-medium text-[var(--color-text-secondary)] print:text-black mt-0.5">
                  {analysis.patient?.birthDate ? (
                    <span>
                      Né(e) le {new Date(analysis.patient.birthDate).toLocaleDateString('fr-FR')}
                      {age !== null ? ` · ${age} ans` : ''}
                    </span>
                  ) : age !== null ? (
                    <span>{age} ans</span>
                  ) : null}
                  <span className="text-slate-300 print:text-black/30">·</span>
                  <span className="uppercase font-bold">{analysis.patient?.gender === 'M' ? 'Homme' : 'Femme'}</span>
                  <span className="text-slate-300 print:text-black/30">·</span>
                  <span>N°: <span className="font-bold text-[var(--color-text)] print:text-black">{analysis.dailyId}</span></span>
                </div>
              </div>
            </div>

            {/* Meta info */}
            <div className="col-span-7 grid grid-cols-2 gap-x-4 gap-y-1 pl-6 border-l border-[var(--color-border)] print:border-black/20 py-1">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Prélèvement</span>
                <p className="text-[12px] font-bold text-[var(--color-text)] print:text-black leading-tight mt-0.5">{datePrelevement}</p>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Édition</span>
                <p className="text-[12px] font-bold text-[var(--color-text)] print:text-black leading-tight mt-0.5">{dateEdition}</p>
              </div>
              {SHOW_DOCTOR && analysis.medecinPrescripteur && (
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Prescripteur</span>
                  <p className="text-[12px] font-bold text-[var(--color-text)] print:text-black leading-tight mt-0.5">{analysis.medecinPrescripteur}</p>
                </div>
              )}
              {SHOW_PROVENANCE && analysis.provenance && (
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.08em] print:text-black/60">Provenance</span>
                  <p className="text-[12px] font-bold text-[var(--color-text)] print:text-black leading-tight mt-0.5">{analysis.provenance}</p>
                </div>
              )}
            </div>
            <div className="col-span-12 h-px bg-[var(--color-surface-muted)] print:bg-black/20" />
          </div>
        </td>
      </tr>
    </thead>
  );
}

