import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, Save } from 'lucide-react';
import { getAnalysisStatusMeta } from '@/lib/analysis-status';
import { isAnalysisFinalValidated } from '@/lib/status-flow';
import { formatSpecimenBlocker, getSpecimenReadiness } from '@/lib/specimen-readiness';
import { useAnalysisContext } from './AnalysisContext';

export function AnalysisValidationFooter() {
  const {
    analysis,
    canTech,
    canBio,
    qcReadiness,
    handleValidation,
    handleSave,
    validating,
    saving,
  } = useAnalysisContext();

  const isFinalValidated = isAnalysisFinalValidated(analysis?.status);
  const hasQcBlockers = Boolean(qcReadiness && !qcReadiness.ready && qcReadiness.blockers.length > 0);
  const specimenReadiness = getSpecimenReadiness(analysis?.specimens);
  const hasSpecimenBlockers = !specimenReadiness.ready;
  const validationBlocked = hasQcBlockers || hasSpecimenBlockers;

  if (!analysis) return null;

  return (
    <div className="mt-8 pt-6 border-t flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)]">Validation du dossier</h3>

      {!isFinalValidated && hasSpecimenBlockers && (
        <div className="w-fit max-w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          <span className="font-semibold">Contrôle pré-analytique bloquant: </span>
          {specimenReadiness.blockers.slice(0, 3).map(formatSpecimenBlocker).join(' ; ')}
          {specimenReadiness.blockers.length > 3 ? ` ; et ${specimenReadiness.blockers.length - 3} autre(s)` : ''}
        </div>
      )}
      
      {!isFinalValidated ? (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 w-fit">
          <button onClick={handleSave} disabled={saving} className="btn-secondary h-9 px-4 disabled:cursor-not-allowed disabled:opacity-60">
            <Save size={16} /> {saving ? '...' : 'Sauvegarder'}
          </button>

          <div className="h-8 w-px bg-slate-200 hidden md:block mx-1" />

          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${getAnalysisStatusMeta(analysis.status).stepNumber >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-[var(--color-text-soft)]'}`}>1</div>
            <div className="flex flex-col min-w-[120px]">
              <span className="section-label leading-none mb-1">Validation Technique</span>
              {getAnalysisStatusMeta(analysis.status).stepNumber >= 2 ? (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle size={12} /> Validée le {analysis.validatedTechAt ? format(new Date(analysis.validatedTechAt), 'dd/MM HH:mm') : ''}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-soft)] font-medium leading-none mt-0.5">Par {analysis.validatedTechName || 'Technicien'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {canTech && analysis.status === 'in_progress' ? (
                    <button
                      onClick={() => handleValidation('tech')}
                      disabled={validating || validationBlocked}
                      className="btn-primary-sm !h-7 !rounded-md !px-3 !text-[10px] disabled:cursor-not-allowed disabled:opacity-50"
                      title={
                        hasSpecimenBlockers
                          ? 'Validation bloquée: contrôle pré-analytique non conforme'
                          : hasQcBlockers
                            ? 'Validation bloquée: QC requis manquant ou en échec'
                            : undefined
                      }
                    >
                      Valider
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 italic">
                      {analysis.status === 'pending' ? 'Saisie...' : 'Attente'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden md:block mx-1" />

          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${analysis.status === 'validated_tech' ? 'bg-indigo-600 text-white' : isFinalValidated ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-[var(--color-text-soft)]'}`}>2</div>
            <div className="flex flex-col min-w-[120px]">
              <span className="section-label leading-none mb-1">Validation Biologique</span>
              {isFinalValidated ? (
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle size={12} /> Signée le {analysis.validatedBioAt ? format(new Date(analysis.validatedBioAt), 'dd/MM HH:mm') : ''}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-soft)] font-medium leading-none mt-0.5">Par {analysis.validatedBioName || 'Biologiste'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {canBio && analysis.status === 'validated_tech' ? (
                    <button onClick={() => handleValidation('bio')} disabled={validating} className="h-7 rounded-md bg-emerald-600 px-3 text-[10px] font-medium text-white transition-colors hover:bg-emerald-700">
                      Signer
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400 italic">
                      {analysis.status === 'validated_tech' ? 'Attente' : 'Verrouillée'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50 p-2.5 w-fit">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-500 text-white">
            <CheckCircle size={20} />
          </div>
          <div className="flex flex-col mr-4">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-1">Dossier Validé & Signé</span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span>{analysis.validatedBioName}</span>
              <span className="text-emerald-300">•</span>
              <span className="text-[var(--color-text-soft)]">{analysis.validatedBioAt ? format(new Date(analysis.validatedBioAt), 'dd MMM yyyy HH:mm', { locale: fr }) : ''}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
