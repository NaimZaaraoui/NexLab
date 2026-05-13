import Database from 'better-sqlite3';
import { getDatabaseFilePath } from './database-backups';

export function checkDatabaseIntegrity() {
  const dbPath = getDatabaseFilePath();

  let db: InstanceType<typeof Database> | null = null;

  try {
    db = new Database(dbPath, { fileMustExist: true, readonly: true });
    const rows = db.pragma('integrity_check') as Array<{ integrity_check: string }>;
    const issues = rows.filter((r) => r.integrity_check !== 'ok');

    if (issues.length === 0) {
      console.log('[NexLab] Database integrity check: OK');
    } else {
      console.error('[NexLab] ⚠️  DATABASE INTEGRITY ISSUES DETECTED:');
      for (const issue of issues) {
        console.error('  -', issue.integrity_check);
      }
      console.error('[NexLab] The database may be corrupted. Restore from a recent backup immediately.');
    }
  } catch (error) {
    console.error('[NexLab] Database integrity check failed to run:', error);
  } finally {
    db?.close();
  }
}
