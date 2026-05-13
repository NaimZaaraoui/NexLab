import { Suspense } from 'react';
import { AnalysesList } from '@/components/analyses/AnalysesList';
import Link from 'next/link';
import { DownloadCloud } from 'lucide-react';

export default function AnalysesPage() {
  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-xl border bg-[var(--color-surface)] px-5 py-4 shadow-[0_2px_8px_rgba(15,31,51,0.03)]">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h1 className="text-lg font-semibold text-[var(--color-text)]">Registre des analyses</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Registre opérationnel des dossiers patients, validations et suivi quotidien.
            </p>
          </div>
          <Link href="/dashboard/exports" className="btn-secondary h-11 px-4">
            <DownloadCloud className="h-4 w-4" />
            Exporter
          </Link>
        </div>
      </section>

      <Suspense fallback={
        <div className="rounded-xl border bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-soft)]">
          Chargement des analyses...
        </div>
      }>
        <AnalysesList />
      </Suspense>
    </div>
  );
}
