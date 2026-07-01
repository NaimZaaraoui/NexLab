'use client';

import type { PatientsData } from '@/components/statistics/types';

interface Props { data: PatientsData; }

export function PatientsPrintSection({ data }: Props) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', value: data.kpis.totalPatients, color: 'text-indigo-700' },
          { label: 'Nouveaux (période)', value: data.kpis.newPatients, color: 'text-emerald-700' },
          { label: 'Vus sur la période', value: data.kpis.uniquePatientsInPeriod, color: 'text-sky-700' },
          { label: 'Récurrents', value: data.kpis.recurringCount, color: 'text-violet-700' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border p-4 bg-slate-50">
            <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">{k.label}</p>
            <p className={`text-2xl font-black mt-1 ${k.color} print:text-black`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 mb-3">Répartition par Sexe</p>
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-3 bg-slate-50 border-b px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
              <div className="col-span-2">Sexe</div><div className="text-right">Nombre</div>
            </div>
            {data.genderDistribution.map(g => (
              <div key={g.gender} className="grid grid-cols-3 px-4 py-2.5 border-b text-sm">
                <div className="col-span-2 font-medium">{g.gender}</div>
                <div className="text-right font-bold">{g.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 mb-3">Pyramide des Âges</p>
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-4 bg-slate-50 border-b px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
              <div className="col-span-2">Tranche</div><div className="text-right">H</div><div className="text-right">F</div>
            </div>
            {data.agePyramid.map(row => (
              <div key={row.bracket} className="grid grid-cols-4 px-4 py-2.5 border-b text-sm">
                <div className="col-span-2 font-medium">{row.bracket}</div>
                <div className="text-right font-bold text-indigo-700 print:text-black">{row.M}</div>
                <div className="text-right font-bold text-pink-600 print:text-black">{row.F}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.topPatients.length > 0 && (
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 mb-3">Top 10 Patients (visites)</p>
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-12 bg-slate-50 border-b px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
              <div className="col-span-1">#</div><div className="col-span-8">Patient</div>
              <div className="col-span-1 text-center">Sexe</div><div className="col-span-2 text-right">Visites</div>
            </div>
            {data.topPatients.map((p, i) => (
              <div key={p.id} className="grid grid-cols-12 items-center px-4 py-2.5 border-b text-sm even:bg-slate-50/40">
                <div className="col-span-1 text-slate-500 font-bold">{i + 1}</div>
                <div className="col-span-8 font-medium">{p.name}</div>
                <div className="col-span-1 text-center text-slate-500">{p.gender}</div>
                <div className="col-span-2 text-right font-bold text-indigo-700 print:text-black">{p.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
