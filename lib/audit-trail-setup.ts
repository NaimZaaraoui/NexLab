import { createClient } from '@libsql/client';
import { getDatabaseFilePath } from './database-backups';

/**
 * Installe les triggers SQLite qui rendent la table audit_logs append-only.
 * À appeler une seule fois au démarrage du serveur (instrumentation.ts).
 *
 * Les triggers bloquent tout UPDATE ou DELETE sur `audit_logs` et
 * `audit_logs_archive`, garantissant la traçabilité réglementaire (ISO 15189).
 */
function createMaintenanceClient() {
  return createClient({
    url: process.env.DATABASE_URL || `file:${getDatabaseFilePath()}`,
    authToken: process.env.DATABASE_AUTH_TOKEN,
    encryptionKey: process.env.DATABASE_ENCRYPTION_KEY,
  });
}

export async function installAuditImmutabilityTriggers() {
  const client = createMaintenanceClient();
  try {
    await client.executeMultiple(`
      CREATE TRIGGER IF NOT EXISTS audit_log_prevent_update
      BEFORE UPDATE ON audit_logs
      BEGIN
        SELECT RAISE(ABORT, 'Audit logs cannot be modified');
      END;

      CREATE TRIGGER IF NOT EXISTS audit_log_prevent_delete
      BEFORE DELETE ON audit_logs
      BEGIN
        SELECT RAISE(ABORT, 'Audit logs cannot be deleted');
      END;

      CREATE TRIGGER IF NOT EXISTS audit_log_archive_prevent_update
      BEFORE UPDATE ON audit_logs_archive
      BEGIN
        SELECT RAISE(ABORT, 'Archived audit logs cannot be modified');
      END;

      CREATE TRIGGER IF NOT EXISTS audit_log_archive_prevent_delete
      BEFORE DELETE ON audit_logs_archive
      BEGIN
        SELECT RAISE(ABORT, 'Archived audit logs cannot be deleted');
      END;
    `);

    console.log('[NexLab] Audit trail immutability triggers: OK');
  } catch (error) {
    console.error('[NexLab] Failed to install audit immutability triggers:', error);
  } finally {
    client.close();
  }
}

/**
 * Vérifie que les 4 triggers d'immutabilité sont bien présents en base.
 * Retourne la liste des triggers manquants.
 */
export async function checkAuditImmutabilityTriggers(): Promise<{ ok: boolean; missingTriggers: string[] }> {
  const expected = [
    'audit_log_prevent_update',
    'audit_log_prevent_delete',
    'audit_log_archive_prevent_update',
    'audit_log_archive_prevent_delete',
  ];

  const client = createMaintenanceClient();
  try {
    const rows = await client.execute({
      sql: `SELECT name FROM sqlite_master WHERE type = 'trigger' AND name IN (${expected.map(() => '?').join(',')})`,
      args: expected,
    });

    const found = new Set(rows.rows.map((row) => String(row.name)));
    const missingTriggers = expected.filter((name) => !found.has(name));

    return { ok: missingTriggers.length === 0, missingTriggers };
  } catch (error) {
    console.error('[NexLab] Failed to check audit immutability triggers:', error);
    return { ok: false, missingTriggers: expected };
  } finally {
    client.close();
  }
}
