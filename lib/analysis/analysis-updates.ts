import { Prisma } from '@/app/generated/prisma';

export type GlobalNotePlacement = 'all' | 'first' | 'last';

export interface AnalysisPatchPayload {
  status?: string;
  printedAt?: string | null;
  dailyId?: string | null;
  receiptNumber?: string | null;
  patientFirstName?: string | null;
  patientLastName?: string | null;
  patientAge?: number | string | null;
  patientGender?: string | null;
  provenance?: string | null;
  medecinPrescripteur?: string | null;
  isUrgent?: boolean;
  globalNote?: string | null;
  globalNotePlacement?: GlobalNotePlacement | string | null;
  amountPaid?: number | string | null;
  paymentMethod?: string | null;
}

export interface AnalysisPatchExistingState {
  status: string | null;
  totalPrice: number | null;
  amountPaid: number | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  paidAt: Date | null;
}

export function parseAnalysisGender(value: unknown) {
  if (value !== 'M' && value !== 'F') return undefined;
  return value;
}

export function parseAnalysisNumber(value: unknown) {
  if (value === null) return null;
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function normalizeGlobalNotePlacement(value: unknown) {
  if (value === 'all' || value === 'first' || value === 'last') {
    return value;
  }
  return undefined;
}

export function isPrintOnlyAnalysisUpdate(body: AnalysisPatchPayload) {
  return (
    body.printedAt !== undefined &&
    body.status === undefined &&
    body.dailyId === undefined &&
    body.receiptNumber === undefined &&
    body.patientFirstName === undefined &&
    body.patientLastName === undefined &&
    body.patientAge === undefined &&
    body.patientGender === undefined &&
    body.provenance === undefined &&
    body.medecinPrescripteur === undefined &&
    body.isUrgent === undefined &&
    body.globalNote === undefined &&
    body.globalNotePlacement === undefined &&
    body.amountPaid === undefined &&
    body.paymentMethod === undefined
  );
}

export function isPaymentOnlyAnalysisUpdate(body: AnalysisPatchPayload) {
  return (
    (body.amountPaid !== undefined || body.paymentMethod !== undefined) &&
    body.status === undefined &&
    body.printedAt === undefined &&
    body.dailyId === undefined &&
    body.receiptNumber === undefined &&
    body.patientFirstName === undefined &&
    body.patientLastName === undefined &&
    body.patientAge === undefined &&
    body.patientGender === undefined &&
    body.provenance === undefined &&
    body.medecinPrescripteur === undefined &&
    body.isUrgent === undefined &&
    body.globalNote === undefined &&
    body.globalNotePlacement === undefined
  );
}

export function buildPaymentState(
  body: AnalysisPatchPayload,
  existing: AnalysisPatchExistingState
) {
  const parsedAmountPaid = parseAnalysisNumber(body.amountPaid);
  const nextAmountPaid =
    parsedAmountPaid !== undefined
      ? Math.max(0, Number(parsedAmountPaid ?? 0))
      : existing.amountPaid ?? 0;
  const totalPrice = existing.totalPrice ?? 0;
  const nextPaymentStatus =
    nextAmountPaid <= 0
      ? 'UNPAID'
      : nextAmountPaid >= totalPrice
        ? 'PAID'
        : 'PARTIAL';
  const nextPaymentMethod =
    body.paymentMethod !== undefined ? (body.paymentMethod || null) : existing.paymentMethod;
  const nextPaidAt =
    parsedAmountPaid !== undefined
      ? nextPaymentStatus === 'PAID'
        ? existing.paidAt || new Date()
        : null
      : undefined;

  return {
    parsedAmountPaid,
    nextAmountPaid,
    nextPaymentStatus,
    nextPaymentMethod,
    nextPaidAt,
  };
}

export function buildAnalysisPatchData(
  body: AnalysisPatchPayload,
  paymentState: ReturnType<typeof buildPaymentState>
): Prisma.AnalysisUpdateInput {
  return {
    status: body.status || undefined,
    printedAt: body.printedAt !== undefined ? (body.printedAt ? new Date(body.printedAt) : null) : undefined,
    dailyId: body.dailyId !== undefined ? (body.dailyId || null) : undefined,
    receiptNumber: body.receiptNumber !== undefined ? (body.receiptNumber || null) : undefined,
    patientFirstName: body.patientFirstName !== undefined ? (body.patientFirstName || null) : undefined,
    patientLastName: body.patientLastName !== undefined ? (body.patientLastName || null) : undefined,
    patientAge: parseAnalysisNumber(body.patientAge),
    patientGender: parseAnalysisGender(body.patientGender),
    provenance: body.provenance !== undefined ? (body.provenance || null) : undefined,
    medecinPrescripteur: body.medecinPrescripteur !== undefined ? (body.medecinPrescripteur || null) : undefined,
    isUrgent: body.isUrgent !== undefined ? Boolean(body.isUrgent) : undefined,
    globalNote: body.globalNote !== undefined ? (body.globalNote?.trim() || null) : undefined,
    globalNotePlacement: normalizeGlobalNotePlacement(body.globalNotePlacement),
    amountPaid: paymentState.parsedAmountPaid !== undefined ? paymentState.nextAmountPaid : undefined,
    paymentStatus: paymentState.parsedAmountPaid !== undefined ? paymentState.nextPaymentStatus : undefined,
    paymentMethod: body.paymentMethod !== undefined ? paymentState.nextPaymentMethod : undefined,
    paidAt: paymentState.nextPaidAt,
  };
}
