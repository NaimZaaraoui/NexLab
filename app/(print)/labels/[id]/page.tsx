'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { Analysis, Specimen } from '@/lib/core/types';
import { Code39Barcode } from '@/components/print/Code39Barcode';
import { PageBackLink } from '@/components/ui/PageBackLink';

type LabelItem = {
  key: string;
  barcode: string;
  title: string;
  subtitle: string;
  specimen?: Specimen;
  copy: number;
};

export default function TubeLabelsPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [copies, setCopies] = useState(6);
  const [ready, setReady] = useState(false);
  const autoPrint = searchParams.get('autoprint') === '1';
  const closeAfterPrint = searchParams.get('closeAfterPrint') === '1';

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetch(`/api/analyses/${id}`);
        const data = await response.json();
        if (mounted && response.ok) {
          setAnalysis(data);
          
          // Get initial copies from searchParams
          const countParam = searchParams.get('count');
          if (countParam) {
            setCopies(Math.max(1, Math.min(50, Number(countParam))));
          }
          
          window.setTimeout(() => setReady(true), 250);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      load();
    }

    return () => {
      mounted = false;
    };
  }, [id, searchParams]);

  useEffect(() => {
    if (!ready || !autoPrint) return;

    const timer = window.setTimeout(() => {
      window.focus();
      window.print();
    }, 300);

    if (closeAfterPrint) {
      const previous = window.onafterprint;
      window.onafterprint = () => {
        previous?.call(window, new Event('afterprint'));
        window.close();
      };

      return () => {
        window.clearTimeout(timer);
        window.onafterprint = previous;
      };
    }

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoPrint, closeAfterPrint, ready]);

  const patientName = useMemo(() => {
    if (!analysis) return '';
    return `${analysis.patient?.firstName || ''} ${analysis.patient?.lastName || ''}`.trim() || 'Patient sans nom';
  }, [analysis]);

  const barcodeValue = useMemo(() => {
    if (!analysis) return '';
    return analysis.orderNumber || analysis.dailyId || analysis.id.slice(0, 12).toUpperCase();
  }, [analysis]);

  const labelItems = useMemo<LabelItem[]>(() => {
    if (!analysis) return [];

    const safeCopies = Math.max(1, Math.min(100, copies));
    const specimens = (analysis.specimens || []).filter((specimen) => specimen.barcode);

    if (specimens.length === 0) {
      return Array.from({ length: safeCopies }, (_, index) => ({
        key: `fallback-${index}`,
        barcode: barcodeValue,
        title: 'Tube',
        subtitle: 'Dossier',
        copy: index + 1,
      }));
    }

    return specimens.flatMap((specimen) =>
      Array.from({ length: safeCopies }, (_, copyIndex) => ({
        key: `${specimen.id}-${copyIndex}`,
        barcode: specimen.barcode || barcodeValue,
        title: specimen.sampleType || 'Échantillon',
        subtitle: specimen.containerType || 'Tube',
        specimen,
        copy: copyIndex + 1,
      }))
    );
  }, [analysis, barcodeValue, copies]);

  if (loading) {
    return <div className="p-6 text-sm text-[var(--color-text-secondary)]">Chargement des etiquettes...</div>;
  }

  if (!analysis) {
    return <div className="p-6 text-sm text-rose-600">Analyse introuvable.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16 print:pb-0 print:space-y-0 print:m-0">
      <section className="rounded-3xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)] print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <PageBackLink href={`/analyses/${analysis.id}`} />
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Etiquettes tubes</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Impression rapide des codes-barres échantillons pour {patientName}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="input-premium flex h-11 items-center gap-3 px-3">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">Nombre</span>
              <input
                type="number"
                min="1"
                max="100"
                value={copies}
                onChange={(event) => setCopies(Number(event.target.value) || 1)}
                className="w-16 border-none bg-transparent text-sm font-semibold outline-none"
              />
            </label>
            <button
              onClick={() => window.print()}
              className="btn-primary-md"
            >
              <Printer size={16} />
              Imprimer {labelItems.length} {labelItems.length > 1 ? 'étiquettes' : 'étiquette'}
            </button>
          </div>
        </div>
      </section>

      <section
        id="tube-label-sheet"
        className="grid grid-cols-1 justify-items-center gap-4 rounded-3xl border bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-[0_8px_24px_rgba(15,31,51,0.05)] sm:grid-cols-2 xl:grid-cols-3 print:block print:border-none print:bg-transparent print:p-0 print:shadow-none"
      >
        {labelItems.map((label) => (
          <article
            key={label.key}
            className="w-full max-w-[320px] rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[0_6px_20px_rgba(15,31,51,0.05)] print:h-[30mm] print:w-[50mm] print:mb-0 print:max-w-none print:break-after-page print:rounded-none print:border-none print:p-[2mm] print:shadow-none print:flex print:flex-col print:justify-center"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 print:text-xs">{label.subtitle}</p>
                <h2 className="mt-0.5 truncate text-sm font-semibold uppercase tracking-tight text-[var(--color-text)] print:text-[11px] print:font-black">
                  {label.title}
                </h2>
                <p className="mt-0.5 truncate text-xs font-semibold text-[var(--color-text-secondary)] print:text-xs print:text-black">
                  {patientName}
                </p>
              </div>
              <div className="shrink-0 rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-secondary)] print:px-1.5 print:text-xs print:border-black">
                {analysis.patient?.gender === 'F' ? 'F' : analysis.patient?.gender === 'M' ? 'M' : 'P'}
              </div>
            </div>

            <div className="mt-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/70 px-2.5 py-2 print:mt-1 print:rounded-[2mm] print:px-1 print:py-1 print:bg-transparent print:border-none">
              <Code39Barcode
                value={label.barcode}
                height={34}
                className="print:[&_svg]:h-[12mm]"
                labelClassName="mt-1 text-center font-mono text-xs font-black tracking-[0.08em] text-[var(--color-text)] print:mt-0.5 print:text-xs print:tracking-[0.08em] print:text-black"
              />
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-xs print:mt-1 print:gap-2 print:text-xs">
              <div>
                <p className="font-bold uppercase tracking-[0.08em] text-slate-500 print:text-black/60 print:text-[6px]">Ordre</p>
                <p className="mt-0.5 truncate font-mono font-semibold text-[var(--color-text)] print:text-black">{analysis.orderNumber}</p>
              </div>
              <div>
                <p className="font-bold uppercase tracking-[0.08em] text-slate-500 print:text-black/60 print:text-[6px]">Tube</p>
                <p className="mt-0.5 truncate font-mono font-semibold text-[var(--color-text)] print:text-black">{label.copy}/{copies}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
