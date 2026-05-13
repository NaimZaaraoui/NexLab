import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const sourceArg = process.argv[2] || 'dev.db';
const outputArg = process.argv[3] || 'demo.db';

async function main() {
  const sourcePath = path.resolve(process.cwd(), sourceArg);
  const outputPath = path.resolve(process.cwd(), outputArg);

  await fs.copyFile(sourcePath, outputPath);

  const db = new Database(outputPath);
  db.pragma('foreign_keys = ON');

  const demoPassword = await bcrypt.hash('DemoLab2026!', 12);

  try {
    const patients = db.prepare('SELECT id FROM patients ORDER BY createdAt ASC').all() as Array<{ id: string }>;
    const analyses = db
      .prepare('SELECT id, "patientId" as patientId FROM analyses ORDER BY "creationDate" ASC')
      .all() as Array<{ id: string; patientId: string | null }>;
    const users = db.prepare('SELECT id, role FROM users ORDER BY createdAt ASC').all() as Array<{ id: string; role: string }>;

    const updatePatient = db.prepare(`
      UPDATE patients
      SET firstName = ?, lastName = ?, phoneNumber = ?, email = ?, address = ?
      WHERE id = ?
    `);

    const updateAnalysis = db.prepare(`
      UPDATE analyses
      SET patientFirstName = ?, patientLastName = ?, provenance = ?, medecinPrescripteur = ?, globalNote = ?
      WHERE id = ?
    `);

    const clearResultNotes = db.prepare('UPDATE results SET notes = NULL');
    const clearNotifications = db.prepare('DELETE FROM notifications');
    const clearAuditLogs = db.prepare('DELETE FROM audit_logs');
    const clearAuditArchive = db.prepare('DELETE FROM audit_logs_archive');
    const updateSetting = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
    const updateUser = db.prepare(`
      UPDATE users
      SET name = ?, email = ?, password = ?, role = ?, isActive = ?, mustChangePassword = ?
      WHERE id = ?
    `);
    const insertUser = db.prepare(`
      INSERT INTO users (id, name, email, password, role, isActive, mustChangePassword, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 1, 0, datetime('now'), datetime('now'))
    `);

    const patientMap = new Map<string, { firstName: string; lastName: string }>();

    db.transaction(() => {
      patients.forEach((patient, index) => {
        const firstName = `Patient ${String(index + 1).padStart(3, '0')}`;
        const lastName = 'Démo';
        patientMap.set(patient.id, { firstName, lastName });
        updatePatient.run(firstName, lastName, '00000000', `patient${index + 1}@demo.local`, 'Adresse masquée', patient.id);
      });

      analyses.forEach((analysis, index) => {
        const patientNames = analysis.patientId ? patientMap.get(analysis.patientId) : null;
        updateAnalysis.run(
          patientNames?.firstName || `Analyse ${index + 1}`,
          patientNames?.lastName || 'Démo',
          'Démo externe',
          'Dr Démo',
          null,
          analysis.id
        );
      });

      clearResultNotes.run();
      clearNotifications.run();
      clearAuditLogs.run();
      clearAuditArchive.run();

      updateSetting.run('NexLab Démonstration', 'lab_name');
      updateSetting.run('Instance de démonstration', 'lab_subtitle');
      updateSetting.run('Données fictives uniquement', 'lab_parent');
      updateSetting.run('', 'lab_phone');
      updateSetting.run('', 'lab_email');

      if (users[0]) {
        updateUser.run('Administrateur Démo', 'admin.demo@nexlab.local', demoPassword, 'ADMIN', 1, 0, users[0].id);
      } else {
        insertUser.run('demo-admin-1', 'Administrateur Démo', 'admin.demo@nexlab.local', demoPassword, 'ADMIN');
      }

      if (users[1]) {
        updateUser.run('Technicien Démo', 'tech.demo@nexlab.local', demoPassword, 'TECHNICIEN', 1, 0, users[1].id);
      } else {
        insertUser.run('demo-tech-1', 'Technicien Démo', 'tech.demo@nexlab.local', demoPassword, 'TECHNICIEN');
      }

      users.slice(2).forEach((user, index) => {
        updateUser.run(
          `Utilisateur Démo ${index + 1}`,
          `user${index + 1}.demo@nexlab.local`,
          demoPassword,
          user.role || 'TECHNICIEN',
          0,
          0,
          user.id
        );
      });
    })();
  } finally {
    db.close();
  }

  console.log(`Demo database created: ${outputPath}`);
  console.log('Admin demo: admin.demo@nexlab.local / DemoLab2026!');
  console.log('Technicien demo: tech.demo@nexlab.local / DemoLab2026!');
}

main().catch((error) => {
  console.error('Failed to prepare demo database:', error);
  process.exit(1);
});
