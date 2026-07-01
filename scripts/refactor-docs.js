const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, '../docs');
const scriptsDir = path.join(__dirname, '../scripts');

// Helpers
function readIfExists(filePath) {
  const fullPath = path.join(docsDir, filePath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath, 'utf8') + '\n\n';
  }
  return '';
}

function writeNewDoc(subPath, content) {
  const fullPath = path.join(docsDir, subPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
}

console.log('Starting docs refactoring...');

// 1. Create directories
['guides', 'security', 'operations', 'development'].forEach(dir => {
  fs.mkdirSync(path.join(docsDir, dir), { recursive: true });
});

// 2. Move SQL file
const sqlPath = path.join(docsDir, 'AUDIT_TRAIL_IMMUTABILITY_MIGRATION.sql');
if (fs.existsSync(sqlPath)) {
  fs.renameSync(sqlPath, path.join(scriptsDir, 'AUDIT_TRAIL_IMMUTABILITY_MIGRATION.sql'));
  console.log('Moved SQL file.');
}

// 3. Guides
const techManual = readIfExists('MANUEL_TECHNICIEN.md') + readIfExists('guide/USER_GUIDE.md');
if (techManual) writeNewDoc('guides/technician-manual.md', techManual);

const adminManual = readIfExists('guide/ADMIN_GUIDE.md');
if (adminManual) writeNewDoc('guides/admin-manual.md', adminManual);

const installation = readIfExists('guide/INSTALLATION.md');
if (installation) writeNewDoc('guides/installation.md', installation);

// 4. Security
const encryption = readIfExists('ENCRYPTION_AT_REST_GUIDE.md') + 
                   readIfExists('ENCRYPTION_IMPLEMENTATION_SUMMARY.md') +
                   readIfExists('ENCRYPTION_QUICK_REFERENCE.md') +
                   readIfExists('PHASE_1_SECURITY_IMPLEMENTATION.md');
if (encryption) writeNewDoc('security/encryption-architecture.md', encryption);

const keyRot = readIfExists('KEY_ROTATION_PROCEDURES.md');
if (keyRot) writeNewDoc('security/key-management.md', keyRot);

const compliance = readIfExists('COMPLIANCE_GDPR.md') + readIfExists('concepts/RGPD_EXPLIQUE.md');
if (compliance) writeNewDoc('security/compliance-gdpr.md', compliance);

// 5. Operations
const dr = readIfExists('DISASTER_RECOVERY_RUNBOOK.md') +
           readIfExists('EMERGENCY_RECOVERY_ENCRYPTED_BACKUPS.md') +
           readIfExists('features/backup-recovery/DEV.md') +
           readIfExists('features/backup-recovery/USER.md');
if (dr) writeNewDoc('operations/disaster-recovery.md', dr);

// 6. Development
const e2e = readIfExists('E2E_TESTING_GUIDE.md');
if (e2e) writeNewDoc('development/e2e-testing.md', e2e);

const commReady = readIfExists('COMMERCIAL_READINESS_CHECKLIST.md');
if (commReady) writeNewDoc('development/commercial-readiness.md', commReady);

const changelog = readIfExists('NEXLAB_VERSION_1.0_LIVRABLE.md');
if (changelog) writeNewDoc('development/changelog-v1.md', changelog);

// 7. Cleanup old files and dirs
const oldFiles = [
  'COMMERCIAL_READINESS_CHECKLIST.md',
  'COMPLIANCE_GDPR.md',
  'DISASTER_RECOVERY_RUNBOOK.md',
  'E2E_TESTING_GUIDE.md',
  'EMERGENCY_RECOVERY_ENCRYPTED_BACKUPS.md',
  'ENCRYPTION_AT_REST_GUIDE.md',
  'ENCRYPTION_IMPLEMENTATION_SUMMARY.md',
  'ENCRYPTION_QUICK_REFERENCE.md',
  'KEY_ROTATION_PROCEDURES.md',
  'MANUEL_TECHNICIEN.md',
  'NEXLAB_VERSION_1.0_LIVRABLE.md',
  'PHASE_1_SECURITY_IMPLEMENTATION.md'
];

oldFiles.forEach(f => {
  const p = path.join(docsDir, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
});

const oldDirs = ['concepts', 'features', 'guide', 'ui'];
oldDirs.forEach(d => {
  const p = path.join(docsDir, d);
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
});

console.log('Docs refactoring complete!');
