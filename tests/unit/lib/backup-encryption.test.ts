import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createDatabaseBackup,
  deleteDatabaseBackup,
  testDatabaseBackupRestore,
  validateStoredDatabaseBackupFile,
} from '@/lib/database-backups';
import {
  createRecoveryBundle,
  testRecoveryBundleRestore,
  validateRecoveryBundleFile,
} from '@/lib/recovery-bundles';

describe('Encrypted backup artifacts', () => {
  let tempDir: string;
  let previousCwd: string;
  let previousDatabaseUrl: string | undefined;
  let previousBackupKey: string | undefined;
  let previousDatabaseKey: string | undefined;

  beforeEach(async () => {
    previousCwd = process.cwd();
    previousDatabaseUrl = process.env.DATABASE_URL;
    previousBackupKey = process.env.BACKUP_ENCRYPTION_KEY;
    previousDatabaseKey = process.env.DATABASE_ENCRYPTION_KEY;

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexlab-backup-test-'));
    process.chdir(tempDir);

    const db = new Database(path.join(tempDir, 'test.db'));
    try {
      db.exec(`
        CREATE TABLE patients (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        );
        INSERT INTO patients (id, name) VALUES ('p1', 'Test Patient');
      `);
    } finally {
      db.close();
    }

    process.env.DATABASE_URL = 'file:./test.db';
    process.env.BACKUP_ENCRYPTION_KEY = 'test-backup-encryption-key';
    delete process.env.DATABASE_ENCRYPTION_KEY;
  });

  afterEach(async () => {
    process.chdir(previousCwd);

    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }

    if (previousBackupKey === undefined) {
      delete process.env.BACKUP_ENCRYPTION_KEY;
    } else {
      process.env.BACKUP_ENCRYPTION_KEY = previousBackupKey;
    }

    if (previousDatabaseKey === undefined) {
      delete process.env.DATABASE_ENCRYPTION_KEY;
    } else {
      process.env.DATABASE_ENCRYPTION_KEY = previousDatabaseKey;
    }

    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('creates encrypted database backups that validate and restore-test', async () => {
    const backup = await createDatabaseBackup();

    expect(backup.fileName).toMatch(/\.sqlite\.enc$/);
    expect(backup.encrypted).toBe(true);

    const validation = await validateStoredDatabaseBackupFile(backup.absolutePath);
    expect(validation).toMatchObject({ valid: true, encrypted: true });

    const restoreTest = await testDatabaseBackupRestore(backup.fileName);
    expect(restoreTest.valid).toBe(true);

    await deleteDatabaseBackup(backup.fileName);
    await expect(fs.stat(backup.absolutePath)).rejects.toThrow();
  });

  it('creates encrypted recovery bundles that validate and restore-test', async () => {
    const bundle = await createRecoveryBundle();

    expect(bundle.fileName).toMatch(/\.tar\.gz\.enc$/);
    expect(bundle.encrypted).toBe(true);

    const validation = await validateRecoveryBundleFile(bundle.absolutePath);
    expect(validation.valid).toBe(true);
    expect(validation.encrypted).toBe(true);
    expect(validation.entries).toContain('nexlab-recovery/data/database.sqlite');

    const restoreTest = await testRecoveryBundleRestore(bundle.fileName);
    expect(restoreTest.valid).toBe(true);

    await fs.unlink(bundle.absolutePath);
  });
});
