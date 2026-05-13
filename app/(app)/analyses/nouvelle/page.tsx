import { Suspense } from 'react';
import { AnalyseForm } from '@/components/analyses/AnalyseForm';

export default function NouvelleAnalysePage() {
  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Nouvelle Analyse</h1>
          <p className="text-sm text-[var(--color-text-soft)] mt-1">Enregistrement d&apos;une demande et création de dossier</p>
        </div>
      </div>
      <Suspense fallback={<div className="text-center text-slate-400 py-10 animate-pulse">Chargement du formulaire...</div>}>
         <AnalyseForm />
      </Suspense>
    </div>
  );
}