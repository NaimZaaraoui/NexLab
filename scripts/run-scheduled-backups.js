"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const prisma_1 = require("@/lib/db/prisma");
const database_backups_1 = require("@/lib/db/database-backups");
const recovery_bundles_1 = require("@/lib/db/recovery-bundles");
const backup_sync_1 = require("@/lib/db/backup-sync");
async function main() {
    const [retentionSetting, recoveryRetentionSetting, targetSetting] = await Promise.all([
        prisma_1.prisma.setting.findUnique({
            where: { key: 'database_backup_retention_count' },
            select: { value: true },
        }),
        prisma_1.prisma.setting.findUnique({
            where: { key: 'database_recovery_retention_count' },
            select: { value: true },
        }),
        prisma_1.prisma.setting.findUnique({
            where: { key: 'database_backup_external_target' },
            select: { value: true },
        }),
    ]);
    const retentionCount = Math.max(0, parseInt(retentionSetting?.value || '10', 10) || 10);
    const recoveryRetentionCount = Math.max(0, parseInt(recoveryRetentionSetting?.value || '10', 10) || 10);
    const externalTarget = process.env.BACKUP_EXTERNAL_TARGET || targetSetting?.value || '';
    const databaseBackup = await (0, database_backups_1.createDatabaseBackup)();
    const recoveryBundle = await (0, recovery_bundles_1.createRecoveryBundle)();
    const pruneResult = await (0, database_backups_1.pruneDatabaseBackups)(retentionCount);
    const pruneRecoveryResult = await (0, recovery_bundles_1.pruneRecoveryBundles)(recoveryRetentionCount);
    console.log(`Database backup created: ${databaseBackup.fileName}`);
    console.log(`Recovery bundle created: ${recoveryBundle.fileName}`);
    console.log(`Retention applied: kept ${retentionCount}, deleted ${pruneResult.deleted.length}`);
    console.log(`Recovery retention applied: kept ${recoveryRetentionCount}, deleted ${pruneRecoveryResult.deleted.length}`);
    if (externalTarget.trim()) {
        const syncResult = await (0, backup_sync_1.syncBackupsToExternalTarget)({
            targetDirectory: externalTarget.trim(),
            databaseBackup,
            recoveryBundle,
        });
        console.log(`External sync completed to: ${syncResult.targetDirectory}`);
        console.log(`Database copy: ${syncResult.databaseBackupPath}`);
        console.log(`Recovery copy: ${syncResult.recoveryBundlePath}`);
    }
    else {
        console.log('No external target configured. Local backups only.');
    }
    await prisma_1.prisma.$disconnect();
}
main().catch(async (error) => {
    console.error('Scheduled backup run failed:', error);
    await prisma_1.prisma.$disconnect();
    process.exit(1);
});
