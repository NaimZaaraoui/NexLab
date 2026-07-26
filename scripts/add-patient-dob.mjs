import 'dotenv/config';
import { PrismaClient } from './app/generated/prisma/index.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';

const dbUrl = process.env.DATABASE_URL?.replace('file:', '') || './prisma/dev.db';
const encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;

async function main() {
  const sqlite = new BetterSqlite3(dbUrl);

  if (encryptionKey) {
    sqlite.pragma(`key="${encryptionKey}"`);
  }

  // Check if column already exists
  const cols = sqlite.pragma('table_info(analyses)') as { name: string }[];
  const exists = cols.some((c) => c.name === 'patientDOB');

  if (exists) {
    console.log('Column patientDOB already exists, nothing to do.');
    sqlite.close();
    return;
  }

  sqlite.exec('ALTER TABLE analyses ADD COLUMN patientDOB DATETIME;');
  console.log('✅ Column patientDOB added successfully to analyses table.');
  sqlite.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
