import 'dotenv/config';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

async function migrateEncrypted() {
  console.log('--- NexLab LIMS: Encrypted Database Migration Tool ---');
  
  const dbPath = path.resolve(process.cwd(), 'dev.db');
  const encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;

  if (!encryptionKey) {
    console.warn('⚠️ Attention: DATABASE_ENCRYPTION_KEY non défini. La migration se fera en clair.');
  }

  const client = createClient({
    url: `file:${dbPath}`,
    encryptionKey: encryptionKey
  });

  try {
    // 1. Check if migrations table exists
    await client.execute(`
      CREATE TABLE IF NOT EXISTS _custom_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Read migrations directory
    const migrationsDir = path.resolve(process.cwd(), 'prisma/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('Aucun dossier de migration trouvé.');
      return;
    }

    const migrationFolders = fs.readdirSync(migrationsDir)
      .filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory())
      .sort(); // Sort chronologically (Prisma prepends timestamps)

    let appliedCount = 0;

    for (const folder of migrationFolders) {
      const sqlPath = path.join(migrationsDir, folder, 'migration.sql');
      if (!fs.existsSync(sqlPath)) continue;

      // Check if already applied
      const res = await client.execute({
        sql: 'SELECT id FROM _custom_migrations WHERE name = ?',
        args: [folder]
      });

      if (res.rows.length === 0) {
        console.log(`Application de la migration: ${folder}...`);
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute the migration script
        // executeMultiple supports multiple statements including BEGIN, CREATE TRIGGER, etc.
        await client.executeMultiple(sqlContent);

        // Record it
        await client.execute({
          sql: 'INSERT INTO _custom_migrations (name) VALUES (?)',
          args: [folder]
        });
        
        appliedCount++;
      }
    }

    if (appliedCount === 0) {
      console.log('✅ Base de données déjà à jour.');
    } else {
      console.log(`✅ SUCCÈS: ${appliedCount} migration(s) appliquée(s).`);
    }

  } catch (error) {
    console.error('❌ ERREUR lors de la migration:', error);
    process.exit(1);
  }
}

migrateEncrypted();
