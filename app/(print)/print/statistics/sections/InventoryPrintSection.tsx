'use client';

import type { InventoryData } from '@/components/statistics/types';

interface Props { data: InventoryData; }

const MOV_LABELS: Record<string, string> = {
  RECEIVE: 'Réceptions', CONSUME: 'Consommations', WASTE: 'Rebuts', ADJUST: 'Ajustements',
};

export function InventoryPrintSection({ data }: Props) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Réceptions', value: `${data.kpis.totalReceived} u.`, color: 'text-emerald-700' },
          { label: 'Consommé', value: `${data.kpis.totalConsumed} u.`, color: 'text-indigo-700' },
          { label: 'Rebuts', value: `${data.kpis.totalWasted} u.`, color: 'text-rose-700' },
          { label: 'Articles Critiques', value: data.kpis.criticalItemsCount, color: 'text-amber-700' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border p-4 bg-slate-50">
            <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">{k.label}</p>
            <p className={`text-2xl font-black mt-1 ${k.color} print:text-black`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 mb-3">Répartition des Mouvements</p>
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-3 bg-slate-50 border-b px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
            <div className="col-span-2">Type</div><div className="text-right">Quantité</div>
          </div>
          {data.movementTypeBreakdown.map(m => (
            <div key={m.type} className="grid grid-cols-3 px-4 py-2.5 border-b text-sm">
              <div className="col-span-2 font-medium">{MOV_LABELS[m.type] ?? m.type}</div>
              <div className="text-right font-bold">{m.quantity.toLocaleString('fr-FR')}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.1em] text-slate-500 mb-3">Top Réactifs Consommés</p>
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-12 bg-slate-50 border-b px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-slate-500">
            <div className="col-span-1">#</div><div className="col-span-5">Réactif</div>
            <div className="col-span-3">Catégorie</div>
            <div className="col-span-2 text-right">Quantité</div><div className="col-span-1 text-right">N</div>
          </div>
          {data.consumptionRanking.map((item, i) => (
            <div key={item.id} className={`grid grid-cols-12 items-center px-4 py-2.5 border-b text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
              <div className="col-span-1 text-slate-500 font-bold">{i + 1}</div>
              <div className="col-span-5 font-medium truncate">{item.name}</div>
              <div className="col-span-3 text-slate-500 text-xs truncate">{item.category}</div>
              <div className="col-span-2 text-right font-bold text-indigo-700 print:text-black">{item.totalQty} {item.unit}</div>
              <div className="col-span-1 text-right text-slate-500">{item.count}</div>
            </div>
          ))}
        </div>
      </div>

      {data.criticalItems.length > 0 && (
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-amber-500 mb-3">⚠ Articles en Stock Critique</p>
          <div className="overflow-hidden rounded-xl border border-amber-200">
            <div className="grid grid-cols-12 bg-amber-50 border-b border-amber-100 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-amber-700">
              <div className="col-span-5">Réactif</div><div className="col-span-3">Catégorie</div>
              <div className="col-span-2 text-right">Stock</div><div className="col-span-2 text-right">Seuil</div>
            </div>
            {data.criticalItems.map(item => (
              <div key={item.id} className="grid grid-cols-12 items-center px-4 py-2.5 border-b border-amber-100 text-sm bg-amber-50/30">
                <div className="col-span-5 font-medium">{item.name}</div>
                <div className="col-span-3 text-slate-500 text-xs">{item.category}</div>
                <div className="col-span-2 text-right font-bold text-rose-600 print:text-black">{item.currentStock} {item.unit}</div>
                <div className="col-span-2 text-right text-slate-500">{item.minThreshold} {item.unit}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
