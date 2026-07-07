import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { PageBackLink } from '@/components/ui/PageBackLink';
import { AnalysisMetadataCards } from './AnalysisMetadataCards';
import { AnalysisPaymentPanel } from './AnalysisPaymentPanel';
import { AnalysisWorkflowActions } from './AnalysisWorkflowActions';
import { GlobalNotePanel } from './GlobalNotePanel';

import { useAnalysisContext } from './AnalysisContext';

export function AnalysisHeaderPanel() {
  const router = useRouter();
  const {
    analysis,
    validationError,
    qcReadiness,
    hasQcBlockers,
    prevId,
    nextId,
  } = useAnalysisContext();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === 'ArrowLeft' && prevId) {
        e.preventDefault();
        router.push(`/analyses/${prevId}`);
      } else if (e.key === 'ArrowRight' && nextId) {
        e.preventDefault();
        router.push(`/analyses/${nextId}`);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [prevId, nextId, router]);

  if (!analysis) return null;

  return (
    <div className="rounded-xl border bg-[var(--color-surface)] p-5 shadow-[0_2px_8px_rgba(15,31,51,0.03)] lg:p-6">
      <div className="flex flex-col items-start  gap-6">
        <div className="flex items-start flex-wrap gap-3">
          <PageBackLink href="/analyses" className="mb-0 shrink-0" iconSize={18} />

          <div className="flex items-center gap-1">
            <Link
              href={prevId ? `/analyses/${prevId}` : '#'}
              aria-disabled={!prevId}
              title={prevId ? 'Dossier précédent (Alt + ←)' : 'Pas de dossier précédent'}
              className={`inline-flex items-center justify-center rounded-lg border p-1.5 transition-colors ${prevId
                ? 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                : 'pointer-events-none border-transparent text-[var(--color-text-secondary)] opacity-30'
                }`}
            >
              <ChevronLeft size={15} />
            </Link>
            <Link
              href={nextId ? `/analyses/${nextId}` : '#'}
              aria-disabled={!nextId}
              title={nextId ? 'Dossier suivant (Alt + →)' : 'Pas de dossier suivant'}
              className={`inline-flex items-center justify-center rounded-lg border p-1.5 transition-colors ${nextId
                ? 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
                : 'pointer-events-none border-transparent text-[var(--color-text-secondary)] opacity-30'
                }`}
            >
              <ChevronRight size={15} />
            </Link>
          </div>
          <div>
            <div className="mb-1 flex items-center flex-wrap gap-2">
              <span className="inline-flex rounded-md border border-blue-200/70 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                N° {analysis.orderNumber}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">{format(new Date(analysis.creationDate), 'dd MMMM yyyy', { locale: fr })}</span>
            </div>
            <h1 className={`text-lg font-semibold tracking-tight text-[var(--color-text)] ${!analysis.patientFirstName && !analysis.patientLastName ? 'italic text-[var(--color-text-secondary)]' : ''}`}>
              {(analysis.patientFirstName || analysis.patientLastName) ? (
                <>{analysis.patientFirstName} <span className="text-[var(--color-accent)]">{analysis.patientLastName}</span></>
              ) : 'Patient Sans Nom'}
            </h1>
            {analysis.validatedTechAt && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-accent)]">
                <CheckCircle size={12} />
                <span>Validation technique: {analysis.validatedTechName || 'Utilisateur'} — {format(new Date(analysis.validatedTechAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
              </div>
            )}
            {analysis.validatedBioAt && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle size={12} />
                <span>Validation biologique: {analysis.validatedBioName || 'Utilisateur'} — {format(new Date(analysis.validatedBioAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
              </div>
            )}
            {analysis.printedAt && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600">
                <Printer size={12} />
                <span>Dernière impression: {format(new Date(analysis.printedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
              </div>
            )}
          </div>
        </div>

        {validationError && (
          <div className="w-full rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {validationError}
          </div>
        )}

        {analysis.status === 'in_progress' && qcReadiness && qcReadiness.relevantLots > 0 && (
          <div className={`w-full rounded-xl border px-4 py-3 text-sm ${hasQcBlockers
            ? 'border-amber-200 bg-amber-50 text-amber-900'
            : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {hasQcBlockers ? 'QC requis non conforme avant validation technique' : 'QC requis conforme pour cette analyse'}
                </div>
                <div className="mt-1 text-xs opacity-80">
                  {qcReadiness.relevantLots} lot{qcReadiness.relevantLots > 1 ? 's' : ''} QC lié{qcReadiness.relevantLots > 1 ? 's' : ''} aux tests de cette analyse.
                </div>
              </div>
              <span className={`status-pill ${hasQcBlockers ? 'status-pill-warning' : 'status-pill-success'}`}>
                {hasQcBlockers ? `${qcReadiness.blockers.length} blocage(s)` : 'Prêt'}
              </span>
            </div>
            {hasQcBlockers && (
              <div className="mt-3 space-y-2 text-xs">
                {qcReadiness.blockers.map((blocker, index) => (
                  <div key={`${blocker.materialName}-${blocker.lotNumber}-${index}`} className="rounded-lg border border-amber-200/70 bg-[var(--color-surface)]/70 px-3 py-2">
                    <span className="font-semibold">{blocker.materialName}</span>
                    <span> · lot {blocker.lotNumber} · </span>
                    <span>{blocker.status === 'fail' ? 'QC en échec' : 'QC manquant aujourd’hui'}</span>
                    <div className="mt-1 opacity-80">Tests concernés: {blocker.tests.join(', ')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <AnalysisPaymentPanel />
        <AnalysisWorkflowActions />
      </div>

      <AnalysisMetadataCards
        dailyId={analysis.dailyId || ''}
        patientAge={analysis.patientAge ? String(analysis.patientAge) : ''}
        patientGender={analysis.patientGender || 'M'}
      />

      <GlobalNotePanel />
    </div>
  );
}
