'use client';

import React, { useState } from 'react';
import { FileText, Mail, Printer } from 'lucide-react';

export default function DocumentsPage() {
  const [printUrl, setPrintUrl] = useState<string | null>(null);

  const handlePrintEnvelopeTemplate = () => {
    setPrintUrl(`/envelope?autoprint=1&_t=${Date.now()}`);
  };

  return (
    <>
      <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
        <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <h1 className="text-xl font-semibold text-[var(--color-text)]">Documents & papeterie</h1>
          <p className="mt-1 text-sm text-[var(--color-text-soft)]">
            Gérer et imprimer les modèles administratifs du laboratoire.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <button type="button" onClick={handlePrintEnvelopeTemplate} className="group block h-full text-left">
            <div className="flex h-full flex-col gap-5 rounded-xl border bg-[var(--color-surface)] p-6 shadow-[0_2px_8px_rgba(15,31,51,0.03)] transition-colors hover:bg-[var(--color-surface-muted)]">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
                  <Mail size={24} />
                </div>
                <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">
                  A4 Portrait
                </div>
              </div>

              <div className="flex-1">
                <h3 className="mb-2 text-lg font-semibold uppercase leading-tight text-[var(--color-text)]">
                  Enveloppe (Gabarit)
                </h3>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  Modèle d&apos;enveloppe &quot;Pochette&quot; verticale avec champs vides pour écriture manuelle. Format A4 standard.
                </p>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                  <Printer size={16} />
                  <span>Imprimer le modèle</span>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-soft)]">
                  <Printer size={18} />
                </div>
              </div>
            </div>
          </button>

          <div className="flex cursor-not-allowed flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed bg-[var(--color-surface-muted)] p-8 text-center opacity-60">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-slate-400">
              <FileText size={24} />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
              D&apos;autres documents bientôt...
            </p>
          </div>
        </section>
      </div>

      {printUrl && (
        <iframe
          src={printUrl}
          title="Envelope Print Engine Frame"
          className="absolute w-[1px] h-[1px] opacity-0 pointer-events-none"
          tabIndex={-1}
          style={{ border: 0, left: -10000, top: -10000 }}
        />
      )}
    </>
  );
}
