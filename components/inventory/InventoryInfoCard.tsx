'use client';

interface InventoryInfoCardProps {
  label: string;
  value: string;
}

export function InventoryInfoCard({ label, value }: InventoryInfoCardProps) {
  return (
    <div className="rounded-2xl border bg-[var(--color-surface-muted)] px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">{label}</div>
      <div className="mt-1 text-sm font-medium text-[var(--color-text)]">{value}</div>
    </div>
  );
}
