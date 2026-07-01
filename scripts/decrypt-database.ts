import 'dotenv/config';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

async function decryptDatabase() {
  const encryptedDbPath = path.resolve(process.cwd(), 'dev.db');
  const plainDbPath = path.resolve(process.cwd(), 'plain.db');
  const encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;

  if (!encryptionKey) {
    console.error('No encryption key');
    process.exit(1);
  }

  if (fs.existsSync(plainDbPath)) {
    fs.unlinkSync(plainDbPath);
  }

  const encryptedClient = createClient({
    url: `file:${encryptedDbPath}`,
    encryptionKey: encryptionKey
  });

  try {
    await encryptedClient.execute(`PRAGMA foreign_keys = OFF`);
    await encryptedClient.execute(`ATTACH DATABASE '${plainDbPath}' AS plain KEY ''`);

    const schemaRes = await encryptedClient.execute(`
      SELECT sql FROM sqlite_master 
      WHERE type IN ('table', 'index', 'view') AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_migrations'
    `);
    
    for (const row of schemaRes.rows) {
      if (row.sql) {
        // Need to prefix table name or index name with plain. but it's complex using simple replace
        // Better to use sqlite3 CLI or similar? Wait, libsql client can export.
        // Actually, Prisma uses db push or migrate dev which manages `_prisma_migrations`
      }
    }
  } catch(e) {
    console.error(e);
  }
}
decryptDatabase();
