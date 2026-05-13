import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';

export type DatabaseBackupFile = {
  fileName: string;
  size: number;
  createdAt: string;
  absolutePath: string;
};

export type DatabaseBackupValidation = {
  valid: boolean;
  issues: string[];
};

export type DatabaseBackupRestoreTest = {
  valid: boolean;
  issues: string[];
  checksumSha256: string;
  restoredValidation: DatabaseBackupValidation;
};

const BACKUP_DIR = path.join(process.cwd(), 'backups', 'database');

function normalizeSqlitePath(input: string) {
  const raw = input.startsWith('file:') ? input.slice(5) : input;

  if (raw.startsWith('/')) {
    return raw;
  }

  return path.resolve(process.cwd(), raw);
}

export function getDatabaseFilePath() {
  const url = process.env.DATABASE_URL || 'file:./dev.db';
  return normalizeSqlitePath(url);
}

export function getDatabaseBackupDirectory() {
  return BACKUP_DIR;
}

export async function ensureBackupDirectory() {
  await fs.mkdir(BACKUP_DIR, { recursive: true });
}

export async function computeFileSha256(absolutePath: string) {
  const file = await fs.readFile(absolutePath);
  return crypto.createHash('sha256').update(file).digest('hex');
}

export async function createDatabaseBackup() {
  await ensureBackupDirectory();

  const sourcePath = getDatabaseFilePath();
  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const fileName = `nexlab-backup-${timestamp}.sqlite`;
  const destinationPath = path.join(BACKUP_DIR, fileName);

  const db = new Database(sourcePath, { fileMustExist: true, readonly: true });

  try {
    await db.backup(destinationPath);
  } finally {
    db.close();
  }

  const stat = await fs.stat(destinationPath);

  return {
    fileName,
    absolutePath: destinationPath,
    size: stat.size,
    createdAt: stat.birthtime.toISOString(),
  } satisfies DatabaseBackupFile;
}

export function validateDatabaseBackupFile(absolutePath: string): DatabaseBackupValidation {
  let db: InstanceType<typeof Database> | null = null;

  try {
    db = new Database(absolutePath, { fileMustExist: true, readonly: true });
    const rows = db.pragma('integrity_check') as Array<{ integrity_check: string }>;
    const issues = rows
      .map((row) => String(row.integrity_check))
      .filter((issue) => issue !== 'ok');

    return {
      valid: issues.length === 0,
      issues,
    };
  } catch (error) {
    return {
      valid: false,
      issues: [error instanceof Error ? error.message : 'Validation SQLite impossible'],
    };
  } finally {
    db?.close();
  }
}

export function validateActiveDatabase(): DatabaseBackupValidation {
  return validateDatabaseBackupFile(getDatabaseFilePath());
}

function getSqliteSidecarPaths(databasePath: string) {
  return [`${databasePath}-wal`, `${databasePath}-shm`];
}

export async function removeSqliteSidecars(databasePath: string) {
  await Promise.all(
    getSqliteSidecarPaths(databasePath).map((sidecarPath) =>
      fs.rm(sidecarPath, { force: true }).catch(() => undefined)
    )
  );
}

async function restoreValidatedSqliteFile(sourcePath: string, targetPath: string) {
  const validation = validateDatabaseBackupFile(sourcePath);
  if (!validation.valid) {
    throw new Error(`Le fichier SQLite à restaurer est invalide: ${validation.issues.join(', ')}`);
  }

  const targetDirectory = path.dirname(targetPath);
  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const stagedPath = path.join(targetDirectory, `.nexlab-restore-${timestamp}.sqlite`);
  const previousPath = path.join(targetDirectory, `.nexlab-restore-previous-${timestamp}.sqlite`);
  let previousMoved = false;

  await fs.mkdir(targetDirectory, { recursive: true });
  await removeSqliteSidecars(targetPath);

  try {
    const sourceDb = new Database(sourcePath, { fileMustExist: true, readonly: true });
    try {
      await sourceDb.backup(stagedPath);
    } finally {
      sourceDb.close();
    }

    const stagedValidation = validateDatabaseBackupFile(stagedPath);
    if (!stagedValidation.valid) {
      throw new Error(`La base restaurée en staging est invalide: ${stagedValidation.issues.join(', ')}`);
    }

    try {
      await fs.access(targetPath);
      await fs.rename(targetPath, previousPath);
      previousMoved = true;
    } catch {
      previousMoved = false;
    }

    await fs.rename(stagedPath, targetPath);
    await removeSqliteSidecars(targetPath);

    const activeValidation = validateDatabaseBackupFile(targetPath);
    if (!activeValidation.valid) {
      throw new Error(`La base active restaurée a échoué à la validation: ${activeValidation.issues.join(', ')}`);
    }

    if (previousMoved) {
      await fs.rm(previousPath, { force: true });
    }

    return activeValidation;
  } catch (error) {
    await fs.rm(stagedPath, { force: true }).catch(() => undefined);
    if (previousMoved) {
      try {
        await fs.rename(previousPath, targetPath);
      } catch {
        // Best effort rollback.
      }
    }
    await removeSqliteSidecars(targetPath);
    throw error;
  }
}

export async function testDatabaseBackupRestore(fileName: string): Promise<DatabaseBackupRestoreTest> {
  const backup = await getBackupFileByName(fileName);
  if (!backup) {
    throw new Error('Sauvegarde introuvable.');
  }

  const sourceValidation = validateDatabaseBackupFile(backup.absolutePath);
  const checksumSha256 = await computeFileSha256(backup.absolutePath);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexlab-backup-test-'));
  const tempDbPath = path.join(tempDir, 'restored-test.sqlite');

  try {
    const restoredValidation = sourceValidation.valid
      ? await restoreValidatedSqliteFile(backup.absolutePath, tempDbPath)
      : { valid: false, issues: [...sourceValidation.issues] };

    return {
      valid: sourceValidation.valid && restoredValidation.valid,
      issues: [
        ...sourceValidation.issues,
        ...restoredValidation.issues.filter((issue) => !sourceValidation.issues.includes(issue)),
      ],
      checksumSha256,
      restoredValidation,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export async function createNamedDatabaseBackup(prefix: string) {
  await ensureBackupDirectory();

  const sourcePath = getDatabaseFilePath();
  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '-');
  const fileName = `${safePrefix}-${timestamp}.sqlite`;
  const destinationPath = path.join(BACKUP_DIR, fileName);

  const db = new Database(sourcePath, { fileMustExist: true, readonly: true });

  try {
    await db.backup(destinationPath);
  } finally {
    db.close();
  }

  const stat = await fs.stat(destinationPath);

  return {
    fileName,
    absolutePath: destinationPath,
    size: stat.size,
    createdAt: stat.birthtime.toISOString(),
  } satisfies DatabaseBackupFile;
}

export async function listDatabaseBackups() {
  await ensureBackupDirectory();

  const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true });

  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.sqlite'))
      .map(async (entry) => {
        const absolutePath = path.join(BACKUP_DIR, entry.name);
        const stat = await fs.stat(absolutePath);

        return {
          fileName: entry.name,
          absolutePath,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
        } satisfies DatabaseBackupFile;
      })
  );

  return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBackupFileByName(fileName: string) {
  if (!/^[a-zA-Z0-9._-]+\.sqlite$/.test(fileName)) {
    return null;
  }

  const absolutePath = path.join(BACKUP_DIR, fileName);

  try {
    const stat = await fs.stat(absolutePath);
    if (!stat.isFile()) return null;

    return {
      fileName,
      absolutePath,
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
    } satisfies DatabaseBackupFile;
  } catch {
    return null;
  }
}

export async function restoreDatabaseBackup(fileName: string) {
  const backup = await getBackupFileByName(fileName);
  if (!backup) {
    throw new Error('Sauvegarde introuvable.');
  }

  const destinationPath = getDatabaseFilePath();
  await restoreValidatedSqliteFile(backup.absolutePath, destinationPath);

  return backup;
}

export async function deleteDatabaseBackup(fileName: string) {
  const backup = await getBackupFileByName(fileName);
  if (!backup) {
    return null;
  }

  await fs.unlink(backup.absolutePath);
  return backup;
}

export async function pruneDatabaseBackups(retainCount: number) {
  const safeRetainCount = Math.max(0, Math.floor(retainCount));
  const backups = await listDatabaseBackups();

  if (safeRetainCount <= 0) {
    return { deleted: [] as DatabaseBackupFile[], retained: backups };
  }

  const toDelete = backups.slice(safeRetainCount);
  const deleted: DatabaseBackupFile[] = [];

  for (const backup of toDelete) {
    await fs.unlink(backup.absolutePath);
    deleted.push(backup);
  }

  return {
    deleted,
    retained: backups.slice(0, safeRetainCount),
  };
}
