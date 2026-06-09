import { RateLimiterMemory } from 'rate-limiter-flexible';

const authLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 15,
});

/**
 * Exports lourds (export complet, export CNAM, export patient)
 * Max 10 exports par utilisateur toutes les 10 minutes.
 */
const exportLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60 * 10,
});

/**
 * Statistiques et rapports analytiques
 * Max 30 requêtes par utilisateur par minute.
 */
const statisticsLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60,
});

/**
 * Opérations de base de données sensibles (backup, restore, integrity check)
 * Max 5 opérations par utilisateur toutes les 5 minutes.
 */
const databaseOpsLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60 * 5,
});

export async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    await authLimiter.consume(ip);
    return true;
  } catch {
    return false;
  }
}

export async function checkExportRateLimit(key: string): Promise<boolean> {
  try {
    await exportLimiter.consume(key);
    return true;
  } catch {
    return false;
  }
}

export async function checkStatisticsRateLimit(key: string): Promise<boolean> {
  try {
    await statisticsLimiter.consume(key);
    return true;
  } catch {
    return false;
  }
}

export async function checkDatabaseOpsRateLimit(key: string): Promise<boolean> {
  try {
    await databaseOpsLimiter.consume(key);
    return true;
  } catch {
    return false;
  }
}
