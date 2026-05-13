import type { RangeBasis, TargetRow } from '@/components/qc/config-types';

export function formatQcLimit(value: string, sd: string, multiplier: number) {
  const base = Number(value);
  const spread = Number(sd);
  if (!Number.isFinite(base) || !Number.isFinite(spread)) return '--';
  return (base + spread * multiplier).toFixed(2);
}

export function getEffectiveSd(row: TargetRow, globalRangeBasis: RangeBasis) {
  if (row.inputMode === 'sd') return Number(row.sd).toFixed(2);
  const minValue = Number(row.minValue);
  const maxValue = Number(row.maxValue);
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) return '';
  const divisor = globalRangeBasis === '1sd' ? 2 : globalRangeBasis === '3sd' ? 6 : 4;
  return ((maxValue - minValue) / divisor).toFixed(2);
}

export function getRangeBasisLabel(globalRangeBasis: RangeBasis) {
  return globalRangeBasis === '1sd'
    ? '±1 SD'
    : globalRangeBasis === '3sd'
      ? '±3 SD'
      : '±2 SD';
}
