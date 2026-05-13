import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import Database from 'better-sqlite3';
import { getDatabaseFilePath, removeSqliteSidecars, validateDatabaseBackupFile } from '@/lib/database-backups';

const execFileAsync = promisify(execFile);

export type RecoveryBundleFile = {
  fileName: string;
  size: number;
  createdAt: string;
  absolutePath: string;
};

export type RecoveryBundleValidation = {
  valid: boolean;
  issues: string[];
  entries: string[];
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

export function getRecoveryBundleDirectory() {
  return RECOVERY_DIR;
}

export async function ensureRecoveryBundleDirectory() {
  await fs.mkdir(RECOVERY_DIR, { recursive: true });
}

export async function createRecoveryBundle() {
  await ensureRecoveryBundleDirectory();

  const timestamp = new Date().toISOString().replaceAll(':', '-');
  const fileName = `nexlab-recovery-${timestamp}.tar.gz`;
  const destinationPath = path.join(RECOVERY_DIR, fileName);
  const stagingPath = await fs.mkdtemp(path.join(os.tmpdir(), 'nexlab-recovery-'));
  const dbSourcePath = getDatabaseFilePath();
  const bundleRoot = path.join(stagingPath, 'nexlab-recovery');
  const dataDir = path.join(bundleRoot, 'data');
  const appDir = path.join(bundleRoot, 'app-files');

  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(appDir, { recursive: true });

  const dbDestination = path.join(dataDir, 'database.sqlite');
  const db = new Database(dbSourcePath, { fileMustExist: true, readonly: true });

  try {
    await db.backup(dbDestination);
  } finally {
    db.close();
  }

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
    requiredEnv: ['DATABASE_URL', 'NEXTAUTH_SECRET'],
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
      '4. Verifier DATABASE_URL et NEXTAUTH_SECRET.',
      '5. Redemarrer l application.',
      '',
    ].join('\n'),
    'utf8'
  );

  try {
    await execFileAsync('tar', ['-czf', destinationPath, '-C', stagingPath, 'nexlab-recovery']);
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
  } satisfies RecoveryBundleFile;
}

export async function validateRecoveryBundleFile(absolutePath: string): Promise<RecoveryBundleValidation> {
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
    };
  } catch (error) {
    return {
      valid: false,
      issues: [error instanceof Error ? error.message : 'Archive invalide ou illisible'],
      entries: [],
    };
  }
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

    await execFileAsync('tar', ['-xzf', bundle.absolutePath, '-C', stagingPath]);

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
      .filter((entry) => entry.isFile() && entry.name.endsWith('.tar.gz'))
      .map(async (entry) => {
        const absolutePath = path.join(RECOVERY_DIR, entry.name);
        const stat = await fs.stat(absolutePath);

        return {
          fileName: entry.name,
          absolutePath,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
        } satisfies RecoveryBundleFile;
      })
  );

  return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function normalizeImportedBundleName(fileName: string) {
  const safeBaseName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '-');
  if (!safeBaseName.endsWith('.tar.gz')) {
    throw new Error('Le fichier doit être un bundle .tar.gz.');
  }

  return safeBaseName;
}

export async function importRecoveryBundle(fileName: string, source: Buffer | Uint8Array) {
  await ensureRecoveryBundleDirectory();

  const normalizedName = normalizeImportedBundleName(fileName);
  const destinationBaseName = normalizedName.replace(/\.tar\.gz$/, '');
  let destinationPath = path.join(RECOVERY_DIR, normalizedName);

  try {
    await fs.access(destinationPath);
    const timestamp = new Date().toISOString().replaceAll(':', '-');
    destinationPath = path.join(RECOVERY_DIR, `${destinationBaseName}-import-${timestamp}.tar.gz`);
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
  } satisfies RecoveryBundleFile;
}

export async function getRecoveryBundleByName(fileName: string) {
  if (!/^[a-zA-Z0-9._-]+\.tar\.gz$/.test(fileName)) {
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
    await execFileAsync('tar', ['-xzf', bundle.absolutePath, '-C', stagingPath]);

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
