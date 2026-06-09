import { createClient } from '@libsql/client';
import { getDatabaseFilePath } from './database-backups';

export async function checkDatabaseIntegrity() {
  const client = createClient({
    url: process.env.DATABASE_URL || `file:${getDatabaseFilePath()}`,
    authToken: process.env.DATABASE_AUTH_TOKEN,
    encryptionKey: process.env.DATABASE_ENCRYPTION_KEY,
  });

  try {
    const result = await client.execute('PRAGMA integrity_check');
    const issues = result.rows
      .map((row) => String((row as Record<string, unknown>).integrity_check))
      .filter((issue) => issue !== 'ok');

    if (issues.length === 0) {
      console.log('[NexLab] Database integrity check: OK');
    } else {
      console.error('[NexLab] ⚠️  DATABASE INTEGRITY ISSUES DETECTED:');
      for (const issue of issues) {
        console.error('  -', issue);
      }
      console.error('[NexLab] The database may be corrupted. Restore from a recent backup immediately.');
    }
  } catch (error) {
    console.error('[NexLab] Database integrity check failed to run:', error);
  } finally {
    client.close();
  }
}
