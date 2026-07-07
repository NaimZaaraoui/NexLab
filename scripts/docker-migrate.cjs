#!/usr/bin/env node
// docker-migrate.cjs
// Applies pending SQL migrations to the SQLite database at container startup.
// Uses @libsql/client directly -- no Prisma CLI required.
//
// Design notes:
// - Executes each SQL statement individually so we can catch per-statement errors.
// - "duplicate column" / "already exists" errors are treated as "already applied"
//   (they happen when a prior deployment used `prisma db push` instead of migrations).
// - Any other error halts startup to prevent data corruption.

'use strict';

const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DATABASE_URL
  ? path.resolve(process.env.DATABASE_URL.replace(/^file:/, ''))
  : '/app/data/nexlab.db';

const MIGRATIONS_DIR = '/app/prisma/migrations';
const ENCRYPTION_KEY = process.env.DATABASE_ENCRYPTION_KEY || undefined;

function isSafeToSkip(message) {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('duplicate column name') ||
    lower.includes('table already exists') ||
    lower.includes('already exists') ||
    lower.includes('duplicate table name') ||
    lower.includes('index already exists')
  );
}

// Split a SQL file into individual statements, stripping comments and empty lines.
function splitStatements(sql) {
  return sql
    .split(';')
    .map((s) => s.replace(/--[^\n]*/g, '').trim())
    .filter((s) => s.length > 0)
    .map((s) => s + ';');
}

async function run() {
  let createClient;
  try {
    const mod = await import('@libsql/client');
    createClient = mod.createClient;
  } catch (e) {
    console.error('[NexLab] ❌ Could not load @libsql/client:', e.message);
    process.exit(1);
  }

  const client = createClient({
    url: `file:${DB_PATH}`,
    ...(ENCRYPTION_KEY ? { encryptionKey: ENCRYPTION_KEY } : {}),
  });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS _custom_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('[NexLab] No migrations directory found. Skipping.');
    await client.close();
    return;
  }

  const folders = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => fs.statSync(path.join(MIGRATIONS_DIR, f)).isDirectory())
    .sort();

  let appliedCount = 0;
  let recordedCount = 0;

  for (const folder of folders) {
    const sqlPath = path.join(MIGRATIONS_DIR, folder, 'migration.sql');
    if (!fs.existsSync(sqlPath)) continue;

    // Already tracked → skip
    const tracked = await client.execute({
      sql: 'SELECT id FROM _custom_migrations WHERE name = ?',
      args: [folder],
    });
    if (tracked.rows.length > 0) continue;

    console.log(`[NexLab] Processing migration: ${folder}...`);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const statements = splitStatements(sql);

    let hadSkip = false;

    for (const stmt of statements) {
      try {
        await client.execute(stmt);
      } catch (err) {
        const msg = err?.message || String(err);
        if (isSafeToSkip(msg)) {
          console.log(`[NexLab]   ⚠️  Skipped (already applied): ${stmt.slice(0, 80).replace(/\n/g, ' ')}...`);
          hadSkip = true;
        } else {
          // Real error — halt
          console.error(`[NexLab]   ❌ Statement failed: ${stmt.slice(0, 120).replace(/\n/g, ' ')}`);
          console.error(`[NexLab]   Error: ${msg}`);
          await client.close();
          process.exit(1);
        }
      }
    }

    // Record the migration as applied/reconciled
    await client.execute({
      sql: 'INSERT OR IGNORE INTO _custom_migrations (name) VALUES (?)',
      args: [folder],
    });

    if (hadSkip) {
      console.log(`[NexLab] ✅ Migration ${folder} reconciled (was partially applied by previous deployment).`);
      recordedCount++;
    } else {
      console.log(`[NexLab] ✅ Migration ${folder} applied.`);
      appliedCount++;
    }
  }

  if (appliedCount === 0 && recordedCount === 0) {
    console.log('[NexLab] ✅ Database schema is up to date.');
  } else {
    if (appliedCount > 0) console.log(`[NexLab] ✅ Applied ${appliedCount} new migration(s).`);
    if (recordedCount > 0) console.log(`[NexLab] ✅ Reconciled ${recordedCount} pre-existing migration(s).`);
  }

  await client.close();
}

run().catch((err) => {
  console.error('[NexLab] ❌ Unexpected migration error:', err.message || err);
  process.exit(1);
});
