export type QcValueFlag = 'ok' | 'warn' | 'fail';
export type QcRunStatus = 'pass' | 'warn' | 'fail';
export type QcControlMode = 'STATISTICAL' | 'ACCEPTANCE_RANGE';

export function evaluateWestgard(
  zScore: number,
  previousZScores: number[]
): { flag: QcValueFlag; rule?: string } {
  const sequence = [zScore, ...previousZScores];

  // 1_3S: Un point au-delà de 3 SD
  if (Math.abs(zScore) > 3) {
    return { flag: 'fail', rule: '1-3S' };
  }

  // 2_2S: Deux points consécutifs au-delà de 2 SD du même côté de la moyenne
  if (sequence.length >= 2) {
    if (Math.abs(sequence[0]) > 2 && Math.abs(sequence[1]) > 2) {
      if (Math.sign(sequence[0]) === Math.sign(sequence[1])) {
        return { flag: 'fail', rule: '2-2S' };
      }
    }
  }

  // R_4S: Différence de 4 SD ou plus entre deux points consécutifs
  if (sequence.length >= 2) {
    if (Math.abs(sequence[0] - sequence[1]) > 4) {
      return { flag: 'fail', rule: 'R-4S' };
    }
  }

  // 4_1S: Quatre points consécutifs au-delà de 1 SD du même côté (Avertissement)
  if (sequence.length >= 4) {
    const firstFour = sequence.slice(0, 4);
    if (firstFour.every((z) => Math.abs(z) > 1 && Math.sign(z) === Math.sign(sequence[0]))) {
      return { flag: 'warn', rule: '4-1S' };
    }
  }

  // 10_X: Dix points consécutifs du même côté de la moyenne (Biais systématique - Avertissement)
  if (sequence.length >= 10) {
    const firstTen = sequence.slice(0, 10);
    if (firstTen.every((z) => Math.sign(z) === Math.sign(sequence[0]) && Math.sign(z) !== 0)) {
      return { flag: 'warn', rule: '10-X' };
    }
  }

  // 1_2S: Règle d'avertissement simple si > 2 SD
  if (Math.abs(zScore) > 2) {
    return { flag: 'warn', rule: '1-2S' };
  }

  return { flag: 'ok' };
}

export function evaluateRunStatus(flags: QcValueFlag[]): QcRunStatus {
  if (flags.includes('fail')) return 'fail';
  if (flags.includes('warn')) return 'warn';
  return 'pass';
}

export function evaluateAcceptanceRange(
  measured: number,
  minAcceptable: number,
  maxAcceptable: number
): { flag: QcValueFlag; inAcceptanceRange: boolean } {
  const inAcceptanceRange = measured >= minAcceptable && measured <= maxAcceptable;
  return {
    flag: inAcceptanceRange ? 'ok' : 'fail',
    inAcceptanceRange,
  };
}

export function getQcZone(zScore: number | null) {
  if (zScore === null || !Number.isFinite(zScore)) {
    return { label: 'Sans zone SD', tone: 'status-pill-info' };
  }

  const abs = Math.abs(zScore);
  if (abs > 3) return { label: 'Au-dela de 3 SD', tone: 'status-pill-error' };
  if (abs > 2) return { label: 'Entre 2 et 3 SD', tone: 'status-pill-warning' };
  if (abs > 1) return { label: 'Entre 1 et 2 SD', tone: 'status-pill-info' };
  return { label: 'Dans 1 SD', tone: 'status-pill-success' };
}

export function getQcLevelTone(level: string) {
  const normalized = level.trim().toLowerCase();
  if (normalized === 'critique') return 'critical';
  if (normalized === 'pathologique') return 'warning';
  return 'default';
}
