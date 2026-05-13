'use client';

interface InventorySummaryStatsProps {
  criticalCount: number;
  lowCount: number;
  expiringSoonCount: number;
  expiredCount: number;
}

export function InventorySummaryStats({
  criticalCount,
  lowCount,
  expiringSoonCount,
  expiredCount,
}: InventorySummaryStatsProps) {
  const cards = [
    { label: 'Stock critique', value: criticalCount, hint: 'Articles à zéro ou indisponibles' },
    { label: 'Sous seuil', value: lowCount, hint: 'Stock faible avant rupture' },
    { label: 'Expire sous 30 j', value: expiringSoonCount, hint: 'Lots à anticiper rapidement' },
    { label: 'Déjà expirés', value: expiredCount, hint: 'À isoler ou remplacer' },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="flex flex-col justify-center rounded-[2rem] border border-[var(--color-border)]/50 bg-[var(--color-surface)] p-6 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">{card.label}</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{card.value}</div>
          <div className="mt-1 text-xs text-[var(--color-text-soft)]">{card.hint}</div>
        </article>
      ))}
    </section>
  );
}
