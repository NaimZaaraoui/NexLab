import 'dotenv/config';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

async function encryptDatabase() {
  console.log('--- NexLab LIMS: Database Encryption Tool ---');
  
  const plainDbPath = path.resolve(process.cwd(), 'dev.db');
  const encryptedDbPath = path.resolve(process.cwd(), 'secure.db');
  const backupDbPath = path.resolve(process.cwd(), `dev.backup-${Date.now()}.db`);
  const encryptionKey = process.env.DATABASE_ENCRYPTION_KEY;

  if (!encryptionKey) {
    console.error('❌ ERREUR: DATABASE_ENCRYPTION_KEY n\'est pas défini dans .env');
    process.exit(1);
  }

  if (!fs.existsSync(plainDbPath)) {
    console.error(`❌ ERREUR: La base de données source (${plainDbPath}) n'existe pas.`);
    process.exit(1);
  }

  if (fs.existsSync(encryptedDbPath)) {
    console.warn(`⚠️ Attention: Le fichier de destination ${encryptedDbPath} existe déjà. Suppression...`);
    fs.unlinkSync(encryptedDbPath);
  }

  console.log('1. Création de la nouvelle base de données chiffrée...');
  const encryptedClient = createClient({
    url: `file:${encryptedDbPath}`,
    encryptionKey: encryptionKey
  });

  try {
    console.log('2. Attachement de la base en clair et désactivation des FK...');
    await encryptedClient.execute(`PRAGMA foreign_keys = OFF`);
    await encryptedClient.execute(`ATTACH DATABASE '${plainDbPath}' AS plain KEY ''`);

    console.log('3. Copie du schéma (migration de la structure)...');
    // On récupère le schéma complet de la base en clair
    const schemaRes = await encryptedClient.execute(`
      SELECT sql FROM plain.sqlite_master 
      WHERE type IN ('table', 'index', 'view') AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%'
    `);
    
    for (const row of schemaRes.rows) {
      if (row.sql) {
        await encryptedClient.execute(row.sql as string);
      }
    }

    console.log('4. Copie des données...');
    const tablesRes = await encryptedClient.execute(`
      SELECT name FROM plain.sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    `);

    for (const row of tablesRes.rows) {
      const tableName = row.name as string;
      console.log(`   - Transfert de la table: ${tableName}`);
      await encryptedClient.execute(`INSERT INTO ${tableName} SELECT * FROM plain.${tableName}`);
    }

    console.log('5. Détachement de la base en clair et réactivation des FK...');
    await encryptedClient.execute(`DETACH DATABASE plain`);
    await encryptedClient.execute(`PRAGMA foreign_keys = ON`);
    
    // Fermer la connexion pour libérer les fichiers sous Windows
    encryptedClient.close();

    console.log('6. Remplacement des fichiers...');
    fs.renameSync(plainDbPath, backupDbPath);
    fs.renameSync(encryptedDbPath, plainDbPath);

    console.log('✅ SUCCÈS: La base de données a été chiffrée avec succès.');
    console.log(`   L'ancienne base en clair a été sauvegardée sous: ${path.basename(backupDbPath)}`);
    console.log(`   Vous pouvez maintenant utiliser l'application normalement.`);

  } catch (error) {
    console.error('❌ ERREUR lors du chiffrement:', error);
    if (fs.existsSync(encryptedDbPath)) {
      fs.unlinkSync(encryptedDbPath);
    }
    process.exit(1);
  }
}

encryptDatabase();
