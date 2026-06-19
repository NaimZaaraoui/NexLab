import fs from 'node:fs/promises';
import path from 'node:path';
import { createDatabaseBackup, listDatabaseBackups } from '@/lib/db/database-backups';

const BACKUP_RETENTION_DAYS = 30;
const BACKUP_HOUR = 2; // Run at 02:00 every night

function msUntilNextRun(targetHour: number): number {
  const now = new Date();
  const next = new Date();
  next.setHours(targetHour, 0, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

async function pruneByAge(retentionDays: number): Promise<number> {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const backups = await listDatabaseBackups();
  let deleted = 0;
  for (const backup of backups) {
    if (new Date(backup.createdAt).getTime() < cutoff) {
      try {
        await fs.unlink(backup.absolutePath);
        deleted++;
      } catch {
        // If already gone, skip silently
      }
    }
  }
  return deleted;
}

async function runNightlyBackup() {
  const startedAt = new Date().toISOString();
  console.log(`[NexLab Auto-Backup] 🕐 Starting nightly backup at ${startedAt}`);

  try {
    const backupDir = path.join(process.cwd(), 'backups', 'database');
    await fs.mkdir(backupDir, { recursive: true });

    const result = await createDatabaseBackup();
    const sizeKB = (result.size / 1024).toFixed(1);
    const encrypted = result.encrypted ? '(encrypted)' : '(plain)';
    console.log(`[NexLab Auto-Backup] ✅ Backup created: ${result.fileName} — ${sizeKB} KB ${encrypted}`);

    const pruned = await pruneByAge(BACKUP_RETENTION_DAYS);
    if (pruned > 0) {
      console.log(`[NexLab Auto-Backup] 🗑️  Pruned ${pruned} backup(s) older than ${BACKUP_RETENTION_DAYS} days.`);
    }

    // --- NEW: EXTERNAL SYNC (Google Drive) ---
    const externalDir = process.env.EXTERNAL_BACKUP_DIR;
    if (externalDir) {
      try {
        await fs.mkdir(externalDir, { recursive: true });
        const externalDest = path.join(externalDir, result.fileName);
        await fs.copyFile(result.absolutePath, externalDest);
        console.log(`[NexLab Auto-Backup] ☁️  Synced to external cloud/drive: ${externalDest}`);
        
        // Prune the external drive too (keeps cloud space clean)
        const extFiles = await fs.readdir(externalDir);
        const cutoff = Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
        let extPruned = 0;
        for (const file of extFiles) {
          if (!file.startsWith('nexlab-backup-')) continue;
          const extPath = path.join(externalDir, file);
          const stat = await fs.stat(extPath);
          if (stat.mtimeMs < cutoff) {
            await fs.unlink(extPath);
            extPruned++;
          }
        }
        if (extPruned > 0) {
          console.log(`[NexLab Auto-Backup] ☁️  Pruned ${extPruned} old backup(s) from external drive.`);
        }
      } catch (syncError) {
        console.error('[NexLab Auto-Backup] ❌ External sync failed. Check EXTERNAL_BACKUP_DIR permissions:', syncError);
      }
    }

    console.log(`[NexLab Auto-Backup] ✅ Nightly backup complete.`);
  } catch (error) {
    console.error('[NexLab Auto-Backup] ❌ Backup failed:', error);
  }
}

let scheduled = false;

export function scheduleAutoBackup() {
  if (scheduled) return;
  scheduled = true;

  const msToFirst = msUntilNextRun(BACKUP_HOUR);
  const hoursToFirst = (msToFirst / 1000 / 60 / 60).toFixed(1);
  console.log(`[NexLab Auto-Backup] ⏰ Scheduled. Next backup in ${hoursToFirst}h (daily at ${BACKUP_HOUR}:00 — keeps last ${BACKUP_RETENTION_DAYS} days).`);

  setTimeout(() => {
    runNightlyBackup();
    setInterval(runNightlyBackup, 24 * 60 * 60 * 1000);
  }, msToFirst);
}
