'use client';

import type { AnalysesData } from '@/components/statistics/types';

interface Props { data: AnalysesData; }

const STATUS_LABELS: Record<string, string> = { pending: 'En attente', validated: 'Validé', cancelled: 'Annulé' };

export function AnalysesPrintSection({ data }: Props) {
  const validationRate = data.kpis.total > 0 ? Math.round((data.kpis.validated / data.kpis.total) * 100) : 0;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Analyses', value: data.kpis.total, color: 'text-indigo-700' },
          { label: `Validées (${validationRate}%)`, value: data.kpis.validated, color: 'text-emerald-700' },
          { label: 'En Attente', value: data.kpis.pending, color: 'text-amber-700' },
          { label: 'Urgentes', value: data.kpis.urgent, color: 'text-rose-700' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border p-4 bg-slate-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{k.label}</p>
            <p className={`text-2xl font-black mt-1 ${k.color} print:text-black`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Répartition par Statut</p>
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-3 bg-slate-50 border-b px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <div>Statut</div><div className="text-center">Nombre</div><div className="text-right">%</div>
          </div>
          {data.statusDistribution.map(s => (
            <div key={s.status} className="grid grid-cols-3 px-4 py-2.5 border-b text-sm">
              <div className="font-medium">{STATUS_LABELS[s.status] ?? s.status}</div>
              <div className="text-center font-bold">{s.count}</div>
              <div className="text-right text-slate-500">{data.kpis.total > 0 ? Math.round((s.count / data.kpis.total) * 100) : 0}%</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">TAT Moyen par Catégorie (minutes)</p>
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-12 bg-slate-50 border-b px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <div className="col-span-5">Catégorie</div>
            <div className="col-span-2 text-right">Moy.</div><div className="col-span-2 text-right">Min</div>
            <div className="col-span-2 text-right">Max</div><div className="col-span-1 text-right">N</div>
          </div>
          {data.tatByCategory.map(c => (
            <div key={c.name} className="grid grid-cols-12 px-4 py-2.5 border-b text-sm">
              <div className="col-span-5 font-medium">{c.name}</div>
              <div className="col-span-2 text-right font-bold text-indigo-700 print:text-black">{c.avgMin}m</div>
              <div className="col-span-2 text-right text-slate-500">{c.minMin}m</div>
              <div className="col-span-2 text-right text-slate-500">{c.maxMin}m</div>
              <div className="col-span-1 text-right text-slate-500">{c.count}</div>
            </div>
          ))}
        </div>
      </div>

      {data.topPrescripteurs.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">Top Prescripteurs</p>
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-3 bg-slate-50 border-b px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <div className="col-span-2">Médecin</div><div className="text-right">Prescriptions</div>
            </div>
            {data.topPrescripteurs.map(p => (
              <div key={p.name} className="grid grid-cols-3 px-4 py-2.5 border-b text-sm">
                <div className="col-span-2 font-medium">{p.name}</div>
                <div className="text-right font-bold text-indigo-700 print:text-black">{p.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
