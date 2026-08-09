import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import Database from 'better-sqlite3';
import {
  createPlainDatabaseSnapshot,
  getDatabaseFilePath,
  removeSqliteSidecars,
  validateDatabaseBackupFile,
} from '@/lib/db/database-backups';

const execFileAsync = promisify(execFile);

export type RecoveryBundleFile = {
  fileName: string;
  size: number;
  createdAt: string;
  absolutePath: string;
  encrypted: boolean;
};

export type RecoveryBundleValidation = {
  valid: boolean;
  issues: string[];
  entries: string[];
  encrypted?: boolean;
};

export type RecoveryBundleRestoreTest = {
  valid: boolean;
  issues: string[];
  checksumSha256: string;
  entries: string[];
  restoredDbValidation: {
    valid: boolean;
    issues: string[];
  };
  restoredUploads: boolean;
};

const RECOVERY_DIR = path.join(process.cwd(), 'backups', 'recovery');
const PLAIN_RECOVERY_SUFFIX = '.tar.gz';
const ENCRYPTED_RECOVERY_SUFFIX = '.tar.gz.enc';
const ENCRYPTED_RECOVERY_MAGIC = 'NEXLAB_RECOVERY_BUNDLE_V1';

type EncryptedRecoveryHeader = {
  magic: typeof ENCRYPTED_RECOVERY_MAGIC;
  algorithm: 'aes-256-gcm';
  kdf: 'scrypt';
  salt: string;
  iv: string;
};

async function copyIfExists(sourcePath: string, destinationPath: string) {
  try {
    await fs.access(sourcePath);
    await fs.cp(sourcePath, destinationPath, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

async function removeDirectorySafe(targetPath: string) {
  await fs.rm(targetPath, { recursive: true, force: true });
}

async function computeFileSha256(absolutePath: string) {
  const file = await fs.readFile(absolutePath);
  return crypto.createHash('sha256').update(file).digest('hex');
}

function getRecoveryEncryptionSecret() {
  return process.env.BACKUP_ENCRYPTION_KEY || process.env.DATABASE_ENCRYPTION_KEY || '';
}

function isRecoveryEncryptionConfigured() {
  return Boolean(getRecoveryEncryptionSecret());
}

function isEncryptedRecoveryBundleName(fileName: string) {
  return fileName.endsWith(ENCRYPTED_RECOVERY_SUFFIX);
}

function isRecoveryBundleName(fileName: string) {
  return fileName.endsWith(PLAIN_RECOVERY_SUFFIX) || isEncryptedRecoveryBundleName(fileName);
}

function deriveRecoveryEncryptionKey(secret: string, salt: Buffer) {
  return crypto.scryptSync(secret, salt, 32);
}

async function encryptRecoveryBundleFile(plainPath: string, encryptedPath: string) {
  const secret = getRecoveryEncryptionSecret();
  if (!secret) {
    throw new Error('BACKUP_ENCRYPTION_KEY ou DATABASE_ENCRYPTION_KEY est requis pour chiffrer les bundles.');
  }

  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveRecoveryEncryptionKey(secret, salt);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = await fs.readFile(plainPath);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  const header: EncryptedRecoveryHeader = {
    magic: ENCRYPTED_RECOVERY_MAGIC,
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

async function decryptRecoveryBundleFile(encryptedPath: string, plainPath: string) {
  const secret = getRecoveryEncryptionSecret();
  if (!secret) {
    throw new Error('Clé de chiffrement des bundles absente. Définissez BACKUP_ENCRYPTION_KEY ou DATABASE_ENCRYPTION_KEY.');
  }

  const file = await fs.readFile(encryptedPath);
  const newlineIndex = file.indexOf(10);
  if (newlineIndex <= 0) {
    throw new Error('Format de bundle chiffré invalide.');
  }

  const header = JSON.parse(file.subarray(0, newlineIndex).toString('utf8')) as EncryptedRecoveryHeader;
  if (
    header.magic !== ENCRYPTED_RECOVERY_MAGIC ||
    header.algorithm !== 'aes-256-gcm' ||
    header.kdf !== 'scrypt'
  ) {
    throw new Error('Format de bundle chiffré non supporté.');
  }

  const payload = file.subarray(newlineIndex + 1);
  if (payload.length <= 16) {
    throw new Error('Bundle chiffré incomplet.');
  }

  const ciphertext = payload.subarray(0, payload.length - 16);
  const tag = payload.subarray(payload.length - 16);
  const key = deriveRecoveryEncryptionKey(secret, Buffer.from(header.salt, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(header.iv, 'base64'));
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  await fs.writeFile(plainPath, plaintext);
}

export function getRecoveryBundleDirectory() {
  return RECOVERY_DIR;
}

export async function ensureRecoveryBundleDirectory() {
  await fs.mkdir(RECOVERY_DIR, { recursive: true });
}

export async function createRecoveryBundle() {
  await ensureRecoveryBundleDirectory();

  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const encrypted = isRecoveryEncryptionConfigured();
  const fileName = `nexlab-recovery-${timestamp}${encrypted ? ENCRYPTED_RECOVERY_SUFFIX : PLAIN_RECOVERY_SUFFIX}`;
  const destinationPath = path.join(RECOVERY_DIR, fileName);
  const stagingPath = await fs.mkdtemp(path.join(os.tmpdir(), 'nexlab-recovery-'));
  const plainArchivePath = encrypted ? path.join(stagingPath, 'nexlab-recovery.tar.gz') : destinationPath;
  const dbSourcePath = getDatabaseFilePath();
  const bundleRoot = path.join(stagingPath, 'nexlab-recovery');
  const dataDir = path.join(bundleRoot, 'data');
  const appDir = path.join(bundleRoot, 'app-files');

  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(appDir, { recursive: true });

  const dbDestination = path.join(dataDir, 'database.sqlite');
  await createPlainDatabaseSnapshot(dbDestination);

  const copiedUploads = await copyIfExists(path.join(process.cwd(), 'public', 'uploads'), path.join(appDir, 'uploads'));
  const copiedDockerCompose = await copyIfExists(path.join(process.cwd(), 'docker-compose.yml'), path.join(bundleRoot, 'docker-compose.yml'));
  const copiedSchema = await copyIfExists(path.join(process.cwd(), 'prisma', 'schema.prisma'), path.join(bundleRoot, 'schema.prisma'));

  const manifest = {
    createdAt: new Date().toISOString(),
    version: 1,
    database: {
      sourcePath: dbSourcePath,
      bundledAs: 'data/database.sqlite',
    },
    includedAssets: {
      uploads: copiedUploads,
      dockerCompose: copiedDockerCompose,
      prismaSchema: copiedSchema,
    },
    requiredEnv: ['DATABASE_URL', 'AUTH_SECRET'],
    restoreNotes: [
      '1. Installer l application NexLab sur une machine saine.',
      '2. Restaurer data/database.sqlite comme base active SQLite.',
      '3. Restaurer le dossier app-files/uploads dans public/uploads.',
      '4. Verifier les variables d environnement avant redemarrage.',
      '5. Demarrer l application puis verifier les donnees critiques.',
    ],
  };

  await fs.writeFile(path.join(bundleRoot, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  await fs.writeFile(
    path.join(bundleRoot, 'RESTORE.txt'),
    [
      'NexLab Recovery Bundle',
      '',
      'Contenu:',
      '- data/database.sqlite',
      '- app-files/uploads',
      '- manifest.json',
      '',
      'Restauration rapide:',
      '1. Stopper l application.',
      '2. Remplacer la base SQLite active par data/database.sqlite.',
      '3. Restaurer public/uploads depuis app-files/uploads.',
      '4. Verifier DATABASE_URL et AUTH_SECRET.',
      '5. Redemarrer l application.',
      '',
    ].join('\n'),
    'utf8'
  );

  try {
    await execFileAsync('tar', ['-czf', plainArchivePath, '-C', stagingPath, 'nexlab-recovery']);
    if (encrypted) {
      await encryptRecoveryBundleFile(plainArchivePath, destinationPath);
    }
  } finally {
    await removeDirectorySafe(stagingPath);
  }

  const stat = await fs.stat(destinationPath);

  const validation = await validateRecoveryBundleFile(destinationPath);
  if (!validation.valid) {
    await fs.rm(destinationPath, { force: true });
    throw new Error(`Bundle cree mais invalide: ${validation.issues.join(', ')}`);
  }

  return {
    fileName,
    absolutePath: destinationPath,
    size: stat.size,
    createdAt: stat.birthtime.toISOString(),
    encrypted,
  } satisfies RecoveryBundleFile;
}

async function validatePlainRecoveryBundleFile(absolutePath: string): Promise<RecoveryBundleValidation> {
  try {
    const { stdout } = await execFileAsync('tar', ['-tzf', absolutePath]);
    const entries = stdout
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean);

    const requiredEntries = [
      'nexlab-recovery/data/database.sqlite',
      'nexlab-recovery/manifest.json',
      'nexlab-recovery/RESTORE.txt',
    ];

    const missingEntries = requiredEntries.filter((entry) => !entries.includes(entry));

    return {
      valid: missingEntries.length === 0,
      issues: missingEntries.map((entry) => `Manquant: ${entry}`),
      entries,
      encrypted: false,
    };
  } catch (error) {
    return {
      valid: false,
      issues: [error instanceof Error ? error.message : 'Archive invalide ou illisible'],
      entries: [],
      encrypted: false,
    };
  }
}

export async function validateRecoveryBundleFile(absolutePath: string): Promise<RecoveryBundleValidation> {
  if (!absolutePath.endsWith(ENCRYPTED_RECOVERY_SUFFIX)) {
    return validatePlainRecoveryBundleFile(absolutePath);
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexlab-recovery-validate-'));
  const plainPath = path.join(tempDir, 'bundle.tar.gz');

  try {
    await decryptRecoveryBundleFile(absolutePath, plainPath);
    const validation = await validatePlainRecoveryBundleFile(plainPath);
    return {
      ...validation,
      encrypted: true,
    };
  } catch (error) {
    return {
      valid: false,
      issues: [error instanceof Error ? error.message : 'Déchiffrement du bundle impossible'],
      entries: [],
      encrypted: true,
    };
  } finally {
    await removeDirectorySafe(tempDir);
  }
}

async function getReadableRecoveryBundlePath(absolutePath: string, tempDir: string) {
  if (!absolutePath.endsWith(ENCRYPTED_RECOVERY_SUFFIX)) {
    return absolutePath;
  }

  const plainPath = path.join(tempDir, 'bundle.tar.gz');
  await decryptRecoveryBundleFile(absolutePath, plainPath);
  return plainPath;
}

export async function testRecoveryBundleRestore(fileName: string): Promise<RecoveryBundleRestoreTest> {
  const bundle = await getRecoveryBundleByName(fileName);
  if (!bundle) {
    throw new Error('Bundle de reprise introuvable.');
  }

  const validation = await validateRecoveryBundleFile(bundle.absolutePath);
  const checksumSha256 = await computeFileSha256(bundle.absolutePath);
  const stagingPath = await fs.mkdtemp(path.join(os.tmpdir(), 'nexlab-recovery-test-'));

  try {
    if (!validation.valid) {
      return {
        valid: false,
        issues: [...validation.issues],
        checksumSha256,
        entries: validation.entries,
        restoredDbValidation: { valid: false, issues: [...validation.issues] },
        restoredUploads: false,
      };
    }

    const readableBundlePath = await getReadableRecoveryBundlePath(bundle.absolutePath, stagingPath);
    await execFileAsync('tar', ['-xzf', readableBundlePath, '-C', stagingPath]);

    const bundleRoot = path.join(stagingPath, 'nexlab-recovery');
    const restoredDbPath = path.join(bundleRoot, 'data', 'database.sqlite');
    const restoredUploadsPath = path.join(bundleRoot, 'app-files', 'uploads');
    const tempRestoredDbPath = path.join(stagingPath, 'simulated-restore.sqlite');

    const embeddedDbValidation = validateDatabaseBackupFile(restoredDbPath);
    let restoredDbValidation = embeddedDbValidation;

    if (embeddedDbValidation.valid) {
      const sourceDb = new Database(restoredDbPath, { fileMustExist: true, readonly: true });
      try {
        await sourceDb.backup(tempRestoredDbPath);
      } finally {
        sourceDb.close();
      }
      restoredDbValidation = validateDatabaseBackupFile(tempRestoredDbPath);
    }

    const restoredUploads = await fs
      .stat(restoredUploadsPath)
      .then((stat) => stat.isDirectory())
      .catch(() => false);

    const issues = [
      ...validation.issues,
      ...embeddedDbValidation.issues,
      ...restoredDbValidation.issues.filter((issue) => !embeddedDbValidation.issues.includes(issue)),
    ];

    return {
      valid: issues.length === 0,
      issues,
      checksumSha256,
      entries: validation.entries,
      restoredDbValidation,
      restoredUploads,
    };
  } finally {
    await removeDirectorySafe(stagingPath);
  }
}

export async function listRecoveryBundles() {
  await ensureRecoveryBundleDirectory();

  const entries = await fs.readdir(RECOVERY_DIR, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && isRecoveryBundleName(entry.name))
      .map(async (entry) => {
        const absolutePath = path.join(RECOVERY_DIR, entry.name);
        const stat = await fs.stat(absolutePath);

        return {
          fileName: entry.name,
          absolutePath,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
          encrypted: isEncryptedRecoveryBundleName(entry.name),
        } satisfies RecoveryBundleFile;
      })
  );

  return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function normalizeImportedBundleName(fileName: string) {
  const safeBaseName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '-');
  if (!isRecoveryBundleName(safeBaseName)) {
    throw new Error('Le fichier doit être un bundle .tar.gz ou .tar.gz.enc.');
  }

  return safeBaseName;
}

export async function importRecoveryBundle(fileName: string, source: Buffer | Uint8Array) {
  await ensureRecoveryBundleDirectory();

  const normalizedName = normalizeImportedBundleName(fileName);
  const destinationBaseName = normalizedName.replace(/\.tar\.gz(\.enc)?$/, '');
  let destinationPath = path.join(RECOVERY_DIR, normalizedName);

  try {
    await fs.access(destinationPath);
    const timestamp = new Date().toISOString().replaceAll(':', '-');
    destinationPath = path.join(
      RECOVERY_DIR,
      `${destinationBaseName}-import-${timestamp}${isEncryptedRecoveryBundleName(normalizedName) ? ENCRYPTED_RECOVERY_SUFFIX : PLAIN_RECOVERY_SUFFIX}`
    );
  } catch {
    // File does not exist yet, keep original name.
  }

  await fs.writeFile(destinationPath, source);

  const validation = await validateRecoveryBundleFile(destinationPath);
  if (!validation.valid) {
    await fs.rm(destinationPath, { force: true });
    throw new Error(`Le bundle importé est invalide ou corrompu: ${validation.issues.join(', ')}`);
  }

  const stat = await fs.stat(destinationPath);

  return {
    fileName: path.basename(destinationPath),
    absolutePath: destinationPath,
    size: stat.size,
    createdAt: stat.birthtime.toISOString(),
    encrypted: isEncryptedRecoveryBundleName(destinationPath),
  } satisfies RecoveryBundleFile;
}

export async function getRecoveryBundleByName(fileName: string) {
  if (!/^[a-zA-Z0-9._-]+\.tar\.gz(\.enc)?$/.test(fileName)) {
    return null;
  }

  const absolutePath = path.join(RECOVERY_DIR, fileName);

  try {
    const stat = await fs.stat(absolutePath);
    if (!stat.isFile()) return null;

    return {
      fileName,
      absolutePath,
      size: stat.size,
      createdAt: stat.birthtime.toISOString(),
      encrypted: isEncryptedRecoveryBundleName(fileName),
    } satisfies RecoveryBundleFile;
  } catch {
    return null;
  }
}

export async function restoreRecoveryBundle(fileName: string) {
  const bundle = await getRecoveryBundleByName(fileName);
  if (!bundle) {
    throw new Error('Bundle de reprise introuvable.');
  }

  const bundleValidation = await validateRecoveryBundleFile(bundle.absolutePath);
  if (!bundleValidation.valid) {
    throw new Error(`Bundle de reprise invalide: ${bundleValidation.issues.join(', ')}`);
  }

  const stagingPath = await fs.mkdtemp(path.join(os.tmpdir(), 'nexlab-recovery-restore-'));

  try {
    const readableBundlePath = await getReadableRecoveryBundlePath(bundle.absolutePath, stagingPath);
    await execFileAsync('tar', ['-xzf', readableBundlePath, '-C', stagingPath]);

    const bundleRoot = path.join(stagingPath, 'nexlab-recovery');
    const restoredDbPath = path.join(bundleRoot, 'data', 'database.sqlite');
    const restoredUploadsPath = path.join(bundleRoot, 'app-files', 'uploads');
    const targetDbPath = getDatabaseFilePath();
    const targetUploadsPath = path.join(process.cwd(), 'public', 'uploads');
    const restoredDbValidation = validateDatabaseBackupFile(restoredDbPath);
    if (!restoredDbValidation.valid) {
      throw new Error(`La base contenue dans le bundle est invalide: ${restoredDbValidation.issues.join(', ')}`);
    }

    const uploadsExists = await fs
      .stat(restoredUploadsPath)
      .then((stat) => stat.isDirectory())
      .catch(() => false);

    const targetDbDirectory = path.dirname(targetDbPath);
    const timestamp = new Date().toISOString().replaceAll(':', '-');
    const stagedDbPath = path.join(targetDbDirectory, `.nexlab-bundle-restore-${timestamp}.sqlite`);
    const previousDbPath = path.join(targetDbDirectory, `.nexlab-bundle-restore-previous-${timestamp}.sqlite`);
    let previousDbMoved = false;

    const sourceDb = new Database(restoredDbPath, { fileMustExist: true, readonly: true });
    try {
      await sourceDb.backup(stagedDbPath);
    } finally {
      sourceDb.close();
    }

    const stagedDbValidation = validateDatabaseBackupFile(stagedDbPath);
    if (!stagedDbValidation.valid) {
      throw new Error(`La base du bundle restaurée en staging est invalide: ${stagedDbValidation.issues.join(', ')}`);
    }

    let stagedUploadsPath: string | null = null;
    let previousUploadsPath: string | null = null;

    if (uploadsExists) {
      stagedUploadsPath = path.join(path.dirname(targetUploadsPath), `.nexlab-bundle-uploads-${timestamp}`);
      await fs.rm(stagedUploadsPath, { recursive: true, force: true });
      await fs.cp(restoredUploadsPath, stagedUploadsPath, { recursive: true });
    }

    try {
      try {
        await fs.access(targetDbPath);
        await removeSqliteSidecars(targetDbPath);
        await fs.rename(targetDbPath, previousDbPath);
        previousDbMoved = true;
      } catch {
        previousDbMoved = false;
      }

      await fs.rename(stagedDbPath, targetDbPath);
      await removeSqliteSidecars(targetDbPath);

      if (stagedUploadsPath) {
        previousUploadsPath = path.join(path.dirname(targetUploadsPath), `.nexlab-bundle-uploads-previous-${timestamp}`);
        try {
          await fs.access(targetUploadsPath);
          await fs.rename(targetUploadsPath, previousUploadsPath);
        } catch {
          previousUploadsPath = null;
        }

        try {
          await fs.rename(stagedUploadsPath, targetUploadsPath);
        } catch (error) {
          if (previousUploadsPath) {
            await fs.rename(previousUploadsPath, targetUploadsPath).catch(() => undefined);
          }
          throw error;
        }

        if (previousUploadsPath) {
          await fs.rm(previousUploadsPath, { recursive: true, force: true });
        }
      }

      const activeValidation = validateDatabaseBackupFile(targetDbPath);
      if (!activeValidation.valid) {
        throw new Error(`La base active restaurée depuis le bundle a échoué à la validation: ${activeValidation.issues.join(', ')}`);
      }

      if (previousDbMoved) {
        await fs.rm(previousDbPath, { force: true });
      }

      return {
        bundle,
        restoredUploads: uploadsExists,
      };
    } catch (error) {
      await fs.rm(stagedDbPath, { force: true }).catch(() => undefined);
      if (stagedUploadsPath) {
        await fs.rm(stagedUploadsPath, { recursive: true, force: true }).catch(() => undefined);
      }
      if (previousUploadsPath) {
        await fs.rm(targetUploadsPath, { recursive: true, force: true }).catch(() => undefined);
        await fs.rename(previousUploadsPath, targetUploadsPath).catch(() => undefined);
      }
      if (previousDbMoved) {
        await fs.rename(previousDbPath, targetDbPath).catch(() => undefined);
      }
      await removeSqliteSidecars(targetDbPath).catch(() => undefined);
      throw error;
    }
  } finally {
    await removeDirectorySafe(stagingPath);
  }
}

export async function pruneRecoveryBundles(retainCount: number) {
  const safeRetainCount = Math.max(0, Math.floor(retainCount));
  const bundles = await listRecoveryBundles();

  if (safeRetainCount <= 0) {
    return { deleted: [] as RecoveryBundleFile[], retained: bundles };
  }

  const toDelete = bundles.slice(safeRetainCount);
  const deleted: RecoveryBundleFile[] = [];

  for (const bundle of toDelete) {
    await fs.unlink(bundle.absolutePath);
    deleted.push(bundle);
  }

  return {
    deleted,
    retained: bundles.slice(0, safeRetainCount),
  };
}
