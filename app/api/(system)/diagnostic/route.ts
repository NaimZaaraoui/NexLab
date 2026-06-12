import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import os from 'os';

async function getPrisma() {
  const connectionString = process.env.DATABASE_URL || 'file:./dev.db';
  const adapter = new PrismaBetterSqlite3({ url: connectionString });
  return new PrismaClient({ adapter });
}

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: [] as Record<string, unknown>[],
  };

  // 1. Database connectivity
  try {
    const prisma = await getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    diagnostics.checks.push({
      name: 'database',
      status: 'ok',
      message: 'Database connection successful',
    });
    
    // 2. Database stats
    const userCount = await prisma.user.count();
    const settingCount = await prisma.setting.count();
    const patientCount = await prisma.patient.count();
    const analysisCount = await prisma.analysis.count();
    const testCount = await prisma.test.count();
    
    diagnostics.checks.push({
      name: 'database_stats',
      status: 'ok',
      users: userCount,
      settings: settingCount,
      patients: patientCount,
      analyses: analysisCount,
      tests: testCount,
    });
    
    await prisma.$disconnect();
  } catch (error) {
    diagnostics.checks.push({
      name: 'database',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    diagnostics.status = 'degraded';
  }

  // 3. File system - data directory
  try {
    const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
    const dbExists = fs.existsSync(dbPath);
    
    diagnostics.checks.push({
      name: 'database_file',
      status: dbExists ? 'ok' : 'warning',
      path: dbPath,
      exists: dbExists,
    });

    if (dbExists) {
      const stats = fs.statSync(dbPath);
      diagnostics.checks.push({
        name: 'database_size',
        status: 'ok',
        size_bytes: stats.size,
        size_mb: Math.round(stats.size / 1024 / 1024 * 100) / 100,
      });
    }
  } catch (error) {
    diagnostics.checks.push({
      name: 'filesystem',
      status: 'warning',
      message: error instanceof Error ? error.message : 'Cannot check file system',
    });
  }

  // 4. Backup directory
  try {
    const backupDir = path.join(process.cwd(), 'backups', 'database');
    const backupExists = fs.existsSync(backupDir);
    
    if (backupExists) {
      const files = fs.readdirSync(backupDir);
      const dbFiles = files.filter(f => f.endsWith('.sqlite') || f.endsWith('.db'));
      const latestBackup = dbFiles.length > 0 
        ? fs.statSync(path.join(backupDir, dbFiles[dbFiles.length - 1])) 
        : null;
      
      diagnostics.checks.push({
        name: 'backups',
        status: 'ok',
        backup_count: dbFiles.length,
        latest_backup: latestBackup 
          ? { size_mb: Math.round(latestBackup.size / 1024 / 1024 * 100) / 100 }
          : null,
      });
    } else {
      diagnostics.checks.push({
        name: 'backups',
        status: 'warning',
        message: 'No backup directory found',
      });
    }
  } catch (error) {
    diagnostics.checks.push({
      name: 'backups',
      status: 'warning',
      message: error instanceof Error ? error.message : 'Cannot check backups',
    });
  }

  // 5. Environment info
  diagnostics.checks.push({
    name: 'environment',
    status: 'ok',
    node_version: process.version,
    platform: process.platform,
    next_version: '16.1.2',
  });

  // 6. System Telemetry
  try {
    const memoryUsage = process.memoryUsage();
    diagnostics.checks.push({
      name: 'system_metrics',
      status: 'ok',
      os: os.platform(),
      cpus: os.cpus().length,
      load_avg: os.loadavg()[0], // 1-minute load average
      memory: {
        rss_mb: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
        heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
        free_sys_mb: Math.round(os.freemem() / 1024 / 1024 * 100) / 100,
      }
    });
  } catch(error) {
    // non-critical
  }

  // 7. Critical settings check
  try {
    const prisma = await getPrisma();
    const labName = await prisma.setting.findUnique({ where: { key: 'lab_name' } });
    const labBio = await prisma.setting.findUnique({ where: { key: 'lab_bio_name' } });
    
    diagnostics.checks.push({
      name: 'configuration',
      status: labName?.value ? 'ok' : 'warning',
      lab_name: labName?.value || 'Not configured',
      lab_bio: labBio?.value || 'Not configured',
    });
    
    await prisma.$disconnect();
  } catch (error) {
    diagnostics.checks.push({
      name: 'configuration',
      status: 'error',
      message: error instanceof Error ? error.message : 'Cannot check configuration',
    });
    diagnostics.status = 'degraded';
  }

  return NextResponse.json(diagnostics);
}