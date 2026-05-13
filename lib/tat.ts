type TatThresholds = {
  warnMinutes: number;
  alertMinutes: number;
};

type TatAnalysisLike = {
  creationDate?: string | Date | null;
  createdAt?: string | Date | null;
  validatedTechAt?: string | Date | null;
  validatedBioAt?: string | Date | null;
};

export const DEFAULT_TAT_THRESHOLDS: TatThresholds = {
  warnMinutes: 45,
  alertMinutes: 60,
};

function toDate(value?: string | Date | null) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeTatThresholds(warnValue?: string | number | null, alertValue?: string | number | null) {
  const parsedWarn = Number(warnValue);
  const parsedAlert = Number(alertValue);
  const warnMinutes = Number.isFinite(parsedWarn) && parsedWarn > 0 ? parsedWarn : DEFAULT_TAT_THRESHOLDS.warnMinutes;
  const alertMinutes = Number.isFinite(parsedAlert) && parsedAlert > warnMinutes ? parsedAlert : DEFAULT_TAT_THRESHOLDS.alertMinutes;

  return {
    warnMinutes,
    alertMinutes: alertMinutes > warnMinutes ? alertMinutes : warnMinutes + 15,
  };
}

export function getTatMinutes(analysis: TatAnalysisLike, now = new Date()) {
  const start = toDate(analysis.creationDate) ?? toDate(analysis.createdAt);
  if (!start) return null;

  const end = toDate(analysis.validatedBioAt) ?? toDate(analysis.validatedTechAt) ?? now;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
}

export function formatTatLabel(minutes: number | null) {
  if (minutes === null) return '—';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

export function getTatTextClass(
  minutes: number | null,
  thresholds: TatThresholds = DEFAULT_TAT_THRESHOLDS,
) {
  if (minutes === null) return 'text-[var(--color-text-soft)]';
  if (minutes >= thresholds.alertMinutes) return 'text-[var(--color-critical)] font-semibold';
  if (minutes >= thresholds.warnMinutes) return 'text-[var(--color-warning)] font-semibold';
  return 'text-[var(--color-text-soft)]';
}
