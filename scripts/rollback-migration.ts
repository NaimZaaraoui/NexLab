/**
 * CLI utility for rolling back migrations
 * Usage: npx tsx scripts/rollback-migration.ts [migration-name]
 */

import * as fs from 'fs';
import * as path from 'path';
import { MigrationSafetyManager } from '@/lib/migration-safety';

async function rollbackMigration() {
  const args = process.argv.slice(2);
  const migrationName = args[0];

  if (!migrationName) {
    console.log('📋 Available migrations to rollback:\n');

    const manager = new MigrationSafetyManager();
    const history = manager.getMigrationHistory();

    if (history.length === 0) {
      console.log('No migration history found');
      return;
    }

    history.slice(0, 5).forEach((checkpoint, index) => {
      console.log(`${index + 1}. ${checkpoint.migrationName} (${checkpoint.status})`);
      console.log(`   Backup: ${checkpoint.backupPath}`);
      console.log(`   Date: ${new Date(checkpoint.timestamp).toISOString()}\n`);
    });

    console.log('Usage: npx tsx scripts/rollback-migration.ts <migration-name>');
    return;
  }

  try {
    console.log(`🔄 Rolling back migration: ${migrationName}\n`);

    const manager = new MigrationSafetyManager();
    const history = manager.getMigrationHistory();

    const checkpoint = history.find(h => h.migrationName === migrationName);
    if (!checkpoint) {
      console.error(`❌ Migration "${migrationName}" not found in history`);
      return;
    }

    // Confirm rollback
    console.log(`Migration: ${checkpoint.migrationName}`);
    console.log(`Status: ${checkpoint.status}`);
    console.log(`Backup: ${checkpoint.backupPath}`);
    console.log(`\n⚠️  This will restore the database to its state at ${new Date(checkpoint.timestamp).toISOString()}`);
    console.log('All changes after this point will be lost.\n');

    // In production, add interactive confirmation
    console.log('✅ Proceeding with rollback...\n');

    const checkpointPath = path.join(
      './database-checkpoints',
      `${migrationName}-*.json`
    );

    // Find actual checkpoint file
    const checkpointDir = './database-checkpoints';
    const files = fs.readdirSync(checkpointDir);
    const checkpointFile = files.find(f => f.startsWith(migrationName));

    if (!checkpointFile) {
      console.error('❌ Checkpoint file not found');
      return;
    }

    await manager.rollbackToCheckpoint(path.join(checkpointDir, checkpointFile));

    console.log(`✅ Successfully rolled back to ${migrationName}`);
    console.log(`\n💡 To verify, run: npm run prisma:status`);

  } catch (error) {
    console.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

rollbackMigration().catch(console.error);
