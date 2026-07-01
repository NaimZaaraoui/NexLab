'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Printer, Download } from 'lucide-react';
import { StatTabBar } from '@/components/statistics/StatTabBar';
import { PeriodSelector } from '@/components/statistics/PeriodSelector';
import { OverviewTab } from '@/components/statistics/OverviewTab';
import { AnalysesTab } from '@/components/statistics/AnalysesTab';
import { PatientsTab } from '@/components/statistics/PatientsTab';
import { FinancialTab } from '@/components/statistics/FinancialTab';
import { InventoryTab } from '@/components/statistics/InventoryTab';
import { useDirectPrint } from '@/lib/hooks/useDirectPrint';
import type { StatTab, PeriodConfig } from '@/components/statistics/types';

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<StatTab>('overview');
  const [period, setPeriod] = useState<PeriodConfig>({ range: '30d' });
  const [currency, setCurrency] = useState('DA');
  const { printUrl } = useDirectPrint();

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.amount_unit) setCurrency(d.amount_unit); })
      .catch(() => {});
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 })
      .format(val)
      .replace('DZD', currency);

  const handlePrint = () => {
    const params = new URLSearchParams({
      tab: activeTab,
      range: period.range,
      _t: Date.now().toString(),
    });
    if (period.from) params.set('from', period.from);
    if (period.to) params.set('to', period.to);
    printUrl(`/print/statistics/report?${params}`);
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 pb-16">
      {/* Header */}
      <section className="rounded-2xl border border-[var(--color-border)]/50 bg-[var(--color-surface)] px-6 py-5 shadow-sm ring-1 ring-slate-900/[0.04]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <BarChart2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[var(--color-text)]">Statistiques</h1>
              <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                Analyses, patients, finances et inventaire — vue complète du laboratoire.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelector value={period} onChange={setPeriod} />
            <button
              onClick={handlePrint}
              className="btn-primary h-9 gap-2 px-4 text-sm shadow-[0_4px_12px_rgba(79,70,229,0.2)] hover:scale-[1.02] transition-transform"
            >
              <Printer className="h-4 w-4" />
              Imprimer
            </button>
          </div>
        </div>
      </section>

      {/* Tab navigation */}
      <StatTabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab period={period} currency={currency} formatCurrency={formatCurrency} />
      )}
      {activeTab === 'analyses' && (
        <AnalysesTab period={period} />
      )}
      {activeTab === 'patients' && (
        <PatientsTab period={period} />
      )}
      {activeTab === 'financial' && (
        <FinancialTab period={period} currency={currency} formatCurrency={formatCurrency} />
      )}
      {activeTab === 'inventory' && (
        <InventoryTab period={period} />
      )}
    </div>
  );
}
