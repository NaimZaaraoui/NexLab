import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';

export type DatabaseBackupFile = {
  fileName: string;
  size: number;
  createdAt: string;
  absolutePath: string;
  encrypted: boolean;
};

export type DatabaseBackupValidation = {
  valid: boolean;
  issues: string[];
  encrypted?: boolean;
};

export type DatabaseBackupRestoreTest = {
  valid: boolean;
  issues: string[];
  checksumSha256: string;
  restoredValidation: DatabaseBackupValidation;
};

const BACKUP_DIR = path.join(process.cwd(), 'backups', 'database');
const ENCRYPTED_BACKUP_SUFFIX = '.sqlite.enc';
const PLAIN_BACKUP_SUFFIX = '.sqlite';
const ENCRYPTED_BACKUP_MAGIC = 'NEXLAB_DB_BACKUP_V1';

type EncryptedBackupHeader = {
  magic: typeof ENCRYPTED_BACKUP_MAGIC;
  algorithm: 'aes-256-gcm';
  kdf: 'scrypt';
  salt: string;
  iv: string;
};

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

function getBackupEncryptionSecret() {
  return process.env.BACKUP_ENCRYPTION_KEY || process.env.DATABASE_ENCRYPTION_KEY || '';
}

function quoteSqlString(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function isEncryptedBackupFileName(fileName: string) {
  return fileName.endsWith(ENCRYPTED_BACKUP_SUFFIX);
}

function isDatabaseBackupFileName(fileName: string) {
  return fileName.endsWith(PLAIN_BACKUP_SUFFIX) || isEncryptedBackupFileName(fileName);
}

export function isBackupEncryptionConfigured() {
  return Boolean(getBackupEncryptionSecret());
}

function deriveBackupEncryptionKey(secret: string, salt: Buffer) {
  return crypto.scryptSync(secret, salt, 32);
}

async function encryptSqliteBackupFile(plainPath: string, encryptedPath: string) {
  const secret = getBackupEncryptionSecret();
  if (!secret) {
    throw new Error('BACKUP_ENCRYPTION_KEY ou DATABASE_ENCRYPTION_KEY est requis pour chiffrer les sauvegardes.');
  }

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveBackupEncryptionKey(secret, salt);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = await fs.readFile(plainPath);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const header: EncryptedBackupHeader = {
    magic: ENCRYPTED_BACKUP_MAGIC,
    algorithm: 'aes-256-gcm',
    kdf: 'scrypt',
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
  };

  await fs.writeFile(
    encryptedPath,
    Buffer.concat([
      Buffer.from(`${JSON.stringify(header)}\n`, 'utf8'),
      ciphertext,
      tag,
    ])
  );
}

async function decryptSqliteBackupFile(encryptedPath: string, plainPath: string) {
  const secret = getBackupEncryptionSecret();
  if (!secret) {
    throw new Error('Clé de chiffrement des sauvegardes absente. Définissez BACKUP_ENCRYPTION_KEY ou DATABASE_ENCRYPTION_KEY.');
  }

  const file = await fs.readFile(encryptedPath);
  const newlineIndex = file.indexOf(10);
  if (newlineIndex <= 0) {
    throw new Error('Format de sauvegarde chiffrée invalide.');
  }

  const header = JSON.parse(file.subarray(0, newlineIndex).toString('utf8')) as EncryptedBackupHeader;
  if (
    header.magic !== ENCRYPTED_BACKUP_MAGIC ||
    header.algorithm !== 'aes-256-gcm' ||
    header.kdf !== 'scrypt'
  ) {
    throw new Error('Format de sauvegarde chiffrée non supporté.');
  }

  const payload = file.subarray(newlineIndex + 1);
  if (payload.length <= 16) {
    throw new Error('Sauvegarde chiffrée incomplète.');
  }

  const ciphertext = payload.subarray(0, payload.length - 16);
  const tag = payload.subarray(payload.length - 16);
  const key = deriveBackupEncryptionKey(secret, Buffer.from(header.salt, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(header.iv, 'base64'));
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  await fs.writeFile(plainPath, plaintext);
}

async function createLibSqlVacuumSnapshot(destinationPath: string) {
  const client = createClient({
    url: process.env.DATABASE_URL || 'file:./dev.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
    encryptionKey: process.env.DATABASE_ENCRYPTION_KEY,
  });

  try {
    await client.execute(`VACUUM INTO ${quoteSqlString(destinationPath)}`);
  } finally {
    client.close();
  }
}

export async function createPlainDatabaseSnapshot(destinationPath: string) {
  const sourcePath = getDatabaseFilePath();
  const db = new Database(sourcePath, { fileMustExist: true, readonly: true });

  try {
    await db.backup(destinationPath);
  } catch (error) {
    if (error instanceof Error && error.message.includes('file is not a database')) {
      await createLibSqlVacuumSnapshot(destinationPath);
      return;
    }
    throw error;
  } finally {
    db.close();
  }
}

export async function createDatabaseBackup() {
  await ensureBackupDirectory();

  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const encrypted = isBackupEncryptionConfigured();
  const fileName = `nexlab-backup-${timestamp}${encrypted ? ENCRYPTED_BACKUP_SUFFIX : PLAIN_BACKUP_SUFFIX}`;
  const destinationPath = path.join(BACKUP_DIR, fileName);
  const plainTempPath = encrypted
    ? path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'nexlab-backup-create-')), 'database.sqlite')
    : destinationPath;

  try {
    await createPlainDatabaseSnapshot(plainTempPath);
    if (encrypted) {
      await encryptSqliteBackupFile(plainTempPath, destinationPath);
    }
  } finally {
    if (encrypted) {
      await fs.rm(path.dirname(plainTempPath), { recursive: true, force: true });
    }
  }

  const stat = await fs.stat(destinationPath);

  return {
    fileName,
    absolutePath: destinationPath,
    size: stat.size,
    createdAt: stat.birthtime.toISOString(),
    encrypted,
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
      encrypted: false,
    };
  } catch (error) {
    return {
      valid: false,
      issues: [error instanceof Error ? error.message : 'Validation SQLite impossible'],
      encrypted: false,
    };
  } finally {
    db?.close();
  }
}

export async function validateStoredDatabaseBackupFile(absolutePath: string): Promise<DatabaseBackupValidation> {
  if (!absolutePath.endsWith(ENCRYPTED_BACKUP_SUFFIX)) {
    return validateDatabaseBackupFile(absolutePath);
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexlab-backup-validate-'));
  const plainPath = path.join(tempDir, 'database.sqlite');

  try {
    await decryptSqliteBackupFile(absolutePath, plainPath);
    const validation = validateDatabaseBackupFile(plainPath);
    return {
      ...validation,
      encrypted: true,
    };
  } catch (error) {
    return {
      valid: false,
      issues: [error instanceof Error ? error.message : 'Déchiffrement de la sauvegarde impossible'],
      encrypted: true,
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
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
  const tempSourceDir = sourcePath.endsWith(ENCRYPTED_BACKUP_SUFFIX)
    ? await fs.mkdtemp(path.join(os.tmpdir(), 'nexlab-backup-restore-source-'))
    : null;
  const readableSourcePath = tempSourceDir ? path.join(tempSourceDir, 'database.sqlite') : sourcePath;
  if (tempSourceDir) {
    try {
      await decryptSqliteBackupFile(sourcePath, readableSourcePath);
    } catch (error) {
      await fs.rm(tempSourceDir, { recursive: true, force: true });
      throw error;
    }
  }

  const validation = validateDatabaseBackupFile(readableSourcePath);
  if (!validation.valid) {
    if (tempSourceDir) await fs.rm(tempSourceDir, { recursive: true, force: true });
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
    const sourceDb = new Database(readableSourcePath, { fileMustExist: true, readonly: true });
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
  } finally {
    if (tempSourceDir) {
      await fs.rm(tempSourceDir, { recursive: true, force: true });
    }
  }
}

export async function testDatabaseBackupRestore(fileName: string): Promise<DatabaseBackupRestoreTest> {
  const backup = await getBackupFileByName(fileName);
  if (!backup) {
    throw new Error('Sauvegarde introuvable.');
  }

  const sourceValidation = await validateStoredDatabaseBackupFile(backup.absolutePath);
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

  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '-');
  const encrypted = isBackupEncryptionConfigured();
  const fileName = `${safePrefix}-${timestamp}${encrypted ? ENCRYPTED_BACKUP_SUFFIX : PLAIN_BACKUP_SUFFIX}`;
  const destinationPath = path.join(BACKUP_DIR, fileName);
  const plainTempPath = encrypted
    ? path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'nexlab-backup-create-')), 'database.sqlite')
    : destinationPath;

  try {
    await createPlainDatabaseSnapshot(plainTempPath);
    if (encrypted) {
      await encryptSqliteBackupFile(plainTempPath, destinationPath);
    }
  } finally {
    if (encrypted) {
      await fs.rm(path.dirname(plainTempPath), { recursive: true, force: true });
    }
  }

  const stat = await fs.stat(destinationPath);

  return {
    fileName,
    absolutePath: destinationPath,
    size: stat.size,
    createdAt: stat.birthtime.toISOString(),
    encrypted,
  } satisfies DatabaseBackupFile;
}

export async function listDatabaseBackups() {
  await ensureBackupDirectory();

  const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true });

  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && isDatabaseBackupFileName(entry.name))
      .map(async (entry) => {
        const absolutePath = path.join(BACKUP_DIR, entry.name);
        const stat = await fs.stat(absolutePath);

        return {
          fileName: entry.name,
          absolutePath,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
          encrypted: isEncryptedBackupFileName(entry.name),
        } satisfies DatabaseBackupFile;
      })
  );

  return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBackupFileByName(fileName: string) {
  if (!/^[a-zA-Z0-9._-]+\.sqlite(\.enc)?$/.test(fileName)) {
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
      encrypted: isEncryptedBackupFileName(fileName),
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
