import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, ClipboardList, ShieldAlert, TimerReset } from 'lucide-react';
import { QualityEventCapaForm } from '@/components/quality/QualityEventCapaForm';
import { prisma } from '@/lib/db/prisma';

function statusLabel(status: string) {
  if (status === 'RESOLVED') return 'Résolu';
  if (status === 'IN_REVIEW') return 'En revue';
  return 'Ouvert';
}

function statusClass(status: string) {
  if (status === 'RESOLVED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'IN_REVIEW') return 'border-blue-200 bg-blue-50 text-blue-700';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function severityClass(severity: string) {
  if (severity === 'CRITICAL') return 'border-red-200 bg-red-50 text-red-700';
  if (severity === 'WARN') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function actionStatusLabel(status: string) {
  if (status === 'VERIFIED') return 'CAPA vérifiée';
  if (status === 'DONE') return 'CAPA réalisée';
  if (status === 'IN_PROGRESS') return 'CAPA en cours';
  return 'CAPA à faire';
}

function actionStatusClass(status: string) {
  if (status === 'VERIFIED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'DONE') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (status === 'IN_PROGRESS') return 'border-indigo-200 bg-indigo-50 text-indigo-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

export default async function QualityDashboardPage() {
  const events = await prisma.qualityEvent.findMany({
    orderBy: [{ status: 'asc' }, { detectedAt: 'desc' }],
    take: 80,
    include: {
      analysis: { select: { id: true } },
      specimen: { select: { sampleType: true, containerType: true, barcode: true } },
    },
  });

  const openCount = events.filter((event) => event.status === 'OPEN').length;
  const criticalCount = events.filter((event) => event.severity === 'CRITICAL' && event.status !== 'RESOLVED').length;
  const resolvedCount = events.filter((event) => event.status === 'RESOLVED').length;
  const overdueCount = events.filter((event) =>
    event.actionDueDate &&
    event.actionDueDate < new Date() &&
    event.actionStatus !== 'VERIFIED'
  ).length;

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Événements Qualité</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Registre des non-conformités et incidents pré-analytiques détectés dans le workflow.
            </p>
          </div>
          <span className={`status-pill ${criticalCount > 0 ? 'status-pill-error' : openCount > 0 ? 'status-pill-warning' : 'status-pill-success'}`}>
            {criticalCount > 0 ? `${criticalCount} critique(s)` : openCount > 0 ? `${openCount} ouvert(s)` : 'Tous résolus'}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-[var(--color-surface)] p-5 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            Ouverts
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{openCount}</div>
        </div>
        <div className="rounded-xl border bg-[var(--color-surface)] p-5 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Critiques actifs
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{criticalCount}</div>
        </div>
        <div className="rounded-xl border bg-[var(--color-surface)] p-5 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Résolus
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{resolvedCount}</div>
        </div>
        <div className="rounded-xl border bg-[var(--color-surface)] p-5 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">
            <TimerReset className="h-4 w-4 text-indigo-600" />
            CAPA en retard
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{overdueCount}</div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <div className="border-b px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <ClipboardList className="h-4 w-4 text-[var(--color-accent)]" />
            Registre récent
          </div>
        </div>

        {events.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[var(--color-text-soft)]">
            Aucun événement qualité enregistré pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {events.map((event) => (
              <article key={event.id} className="px-5 py-4 transition-colors hover:bg-[var(--color-surface-muted)]">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClass(event.status)}`}>
                        {statusLabel(event.status)}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${severityClass(event.severity)}`}>
                        {event.severity === 'CRITICAL' ? 'Critique' : event.severity === 'WARN' ? 'Alerte' : 'Info'}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${actionStatusClass(event.actionStatus)}`}>
                        {actionStatusLabel(event.actionStatus)}
                      </span>
                      <span className="text-xs font-medium text-[var(--color-text-soft)]">
                        {format(event.detectedAt, 'dd MMM yyyy HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <h2 className="mt-2 text-sm font-semibold text-[var(--color-text)]">{event.title}</h2>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-text-soft)]">
                      {event.orderNumber && <span>Dossier {event.orderNumber}</span>}
                      {event.patientName && <span>{event.patientName}</span>}
                      {event.specimen?.barcode && <span>Code-barres {event.specimen.barcode}</span>}
                      {event.detectedByName && <span>Détecté par {event.detectedByName}</span>}
                      {event.actionOwner && <span>Responsable {event.actionOwner}</span>}
                      {event.actionDueDate && <span>Échéance {format(event.actionDueDate, 'dd/MM/yyyy')}</span>}
                    </div>
                    {event.description && (
                      <p className="mt-2 max-w-4xl whitespace-pre-line text-xs leading-5 text-[var(--color-text-secondary)]">
                        {event.description}
                      </p>
                    )}
                    {event.resolution && (
                      <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                        {event.resolution}
                      </p>
                    )}
                    <QualityEventCapaForm
                      event={{
                        id: event.id,
                        rootCause: event.rootCause,
                        correctiveAction: event.correctiveAction,
                        preventiveAction: event.preventiveAction,
                        actionOwner: event.actionOwner,
                        actionDueDate: event.actionDueDate?.toISOString() || null,
                        actionStatus: event.actionStatus,
                        verificationNote: event.verificationNote,
                        resolution: event.resolution,
                      }}
                    />
                  </div>
                  {event.analysisId && (
                    <Link href={`/analyses/${event.analysisId}`} className="btn-secondary-sm shrink-0">
                      Ouvrir dossier
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
