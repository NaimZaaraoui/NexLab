import { prisma } from '@/lib/prisma';

export const DAILY_ID_CONFLICT_CODE = 'DUPLICATE_DAILY_ID_FOR_DAY';

interface DailyIdConflictParams {
  dailyId: string | null | undefined;
  referenceDate: Date;
  excludeAnalysisId?: string;
}

export function normalizeDailyId(value: string | null | undefined) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function toComparableDailyId(value: string | null | undefined) {
  const normalized = normalizeDailyId(value);
  return normalized ? normalized.toUpperCase() : null;
}

export function getLocalDayBounds(referenceDate: Date) {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export async function findDailyIdConflict({
  dailyId,
  referenceDate,
  excludeAnalysisId,
}: DailyIdConflictParams) {
  const comparableDailyId = toComparableDailyId(dailyId);
  if (!comparableDailyId) {
    return null;
  }

  const { start, end } = getLocalDayBounds(referenceDate);
  const candidates = await prisma.analysis.findMany({
    where: {
      creationDate: {
        gte: start,
        lt: end,
      },
      ...(excludeAnalysisId ? { id: { not: excludeAnalysisId } } : {}),
    },
    select: {
      id: true,
      dailyId: true,
      orderNumber: true,
      patientFirstName: true,
      patientLastName: true,
    },
  });

  return (
    candidates.find(
      (candidate) => toComparableDailyId(candidate.dailyId) === comparableDailyId
    ) ?? null
  );
}

export function isDailyIdConflictError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const message =
    error instanceof Error
      ? error.message
      : 'message' in error && typeof error.message === 'string'
        ? error.message
        : JSON.stringify(error);

  return message.includes(DAILY_ID_CONFLICT_CODE);
}

export function buildDailyIdConflictMessage(
  dailyId: string,
  conflictingOrderNumber?: string | null
) {
  if (conflictingOrderNumber) {
    return `L'ID paillasse "${dailyId}" est déjà utilisé aujourd'hui par le dossier ORD-${conflictingOrderNumber}.`;
  }

  return `L'ID paillasse "${dailyId}" est déjà utilisé aujourd'hui.`;
}
