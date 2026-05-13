'use client';

import React from 'react';
import type { Analysis } from '@/lib/types';
import type { PrintSettings } from '@/components/print/types';
import { resolvePrintBranding } from '@/lib/report-generation';

interface InvoiceFooterProps {
  analysis: Analysis;
  settings?: PrintSettings;
}

/**
 * InvoiceFooter - Renders signature, cachet, and footer information
 * 
 * Includes:
 * - Document information and ID
 * - Signature/stamp area with image support
 * - Biologist credentials
 * - Laboratory contact information
 * - Page number placeholder
 * - Print-safe styling
 * 
 * @param analysis - The analysis for document ID
 * @param settings - Print settings with signature/stamp images and lab info
 */
export const InvoiceFooter: React.FC<InvoiceFooterProps> = ({ analysis, settings }) => {
  const { LAB_NAME, LAB_PHONE, BIO_TITLE, BIO_NAME, BIO_ONMPT, FOOTER_TEXT } = resolvePrintBranding(settings);

  return (
    <div className="pt-6 border-t-2 border-slate-900 print:border-black footer-content">
      <div className="grid grid-cols-3 gap-12">
        <div className="col-span-2">
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4 print:text-black">Informations</h4>
          <p className="text-xs text-[var(--color-text-soft)] leading-relaxed max-w-md print:text-black">
            Document financier généré électriquement.<br />
            <span className="text-[8px] font-semibold text-slate-300 uppercase print:text-black/40">
              ID Document: {analysis.id.substring(0, 8).toUpperCase()}
            </span>
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-full border-b border-slate-900 pb-2 mb-4 text-center print:border-black">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] print:text-black">
              Signature & Cachet
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 w-full">
            <div style={{
              position: 'relative',
              width: '120px',
              height: '90px',
              margin: '0 auto',
            }}>
              {settings?.lab_stamp_image && settings?.lab_bio_signature && (
                <>
                  <img
                    src={settings.lab_stamp_image}
                    alt="Cachet"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '90px',
                      height: '90px',
                      objectFit: 'contain',
                      opacity: 0.9,
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '130px',
                    height: '30px',
                    backgroundColor: 'hsla(0, 0%, 100%, 0.5)',
                    paddingBottom: '4px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}>
                    <img
                      src={settings.lab_bio_signature}
                      alt="Signature"
                      style={{
                        width: '120px',
                        height: '30px',
                        objectFit: 'contain',
                        objectPosition: 'center bottom',
                        filter: 'contrast(1.15)',
                      }}
                    />
                  </div>
                </>
              )}

              {settings?.lab_stamp_image && !settings?.lab_bio_signature && (
                <img
                  src={settings.lab_stamp_image}
                  alt="Cachet"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90px',
                    height: '90px',
                    objectFit: 'contain',
                  }}
                />
              )}

              {!settings?.lab_stamp_image && settings?.lab_bio_signature && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <img
                    src={settings.lab_bio_signature}
                    alt="Signature"
                    style={{
                      width: '130px',
                      height: '30px',
                      objectFit: 'contain',
                      objectPosition: 'center bottom',
                      filter: 'contrast(1.15)',
                    }}
                  />
                  <div style={{
                    width: '120px',
                    height: '90px',
                    border: '1px dashed #cfd2d7ff',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.5,
                  }}>
                    <span style={{
                      fontSize: '7px',
                      color: '#cfd2d7ff',
                      textAlign: 'center',
                      lineHeight: 1.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      transform: 'rotate(-15deg)',
                    }}>
                      Zone de cachet
                    </span>
                  </div>
                </div>
              )}

              {!settings?.lab_stamp_image && !settings?.lab_bio_signature && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '120px',
                  height: '90px',
                  border: '2px dashed #cfd2d7ff',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.5,
                }}>
                  <span style={{
                    fontSize: '8px',
                    color: '#cfd2d7ff',
                    textAlign: 'center',
                    lineHeight: 1.6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    transform: 'rotate(-15deg)',
                  }}>
                    Zone de cachet
                  </span>
                </div>
              )}
            </div>

            <div className="text-center">
              <p className="text-[10px] font-semibold text-[var(--color-accent)] uppercase tracking-wide print:text-black">
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
        <div style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: '8px',
          marginTop: '8px',
          fontSize: '9px',
          color: '#94a3b8',
          textAlign: 'center',
        }}>
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
  );
};
