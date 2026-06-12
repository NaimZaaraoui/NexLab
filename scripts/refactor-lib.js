const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const libDir = path.join(__dirname, '../lib');
const rootDir = path.join(__dirname, '..');

const mapping = {
  'clinical': [
    'calculated-tests.ts', 'calculations.ts', 'interpretations.ts', 'renal-tests.ts',
    'lab-rules.ts', 'test-catalog-validation.ts', 'test-classification.ts',
    'validations.ts', 'validators.ts', 'qc.ts', 'qc-readiness.ts'
  ],
  'analysis': [
    'analysis-daily-id.ts', 'analysis-history.ts', 'analysis-status.ts',
    'analysis-tests.ts', 'analysis-updates.ts', 'specimen-readiness.ts',
    'status-flow.ts', 'status-flow-server.ts', 'tat.ts'
  ],
  'db': [
    'prisma.ts', 'database-backups.ts', 'database-integrity.ts',
    'recovery-bundles.ts', 'backup-sync.ts', 'migration-safety.ts'
  ],
  'inventory': [
    'inventory.ts', 'inventory-shared.ts', 'inventory-categories.ts', 'inventory-notifications.ts'
  ],
  'documents': [
    'pdf-server.ts', 'pdf-storage.ts', 'report-generation.ts', 'excel-utils.ts'
  ],
  'security': [
    'audit.ts', 'audit-retention.ts', 'audit-trail-setup.ts',
    'auth.ts', 'authz.ts', 'csrf-protection.ts', 'rate-limit.ts',
    'license.ts', 'validation-seal.ts'
  ],
  'settings': [
    'settings.ts', 'settings-schema.ts', 'settings-learning.ts'
  ],
  'communications': [
    'resend.ts', 'notifications.ts', 'quality-events.ts'
  ],
  'core': [
    'utils.ts', 'constants.ts', 'types.ts', 'category-icons.ts',
    'error-handling.ts', 'logger.ts', 'performance.ts'
  ]
};

// 1. Create directories
for (const dir of Object.keys(mapping)) {
  const targetDir = path.join(libDir, dir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
}

// 2. Build replacements map (without .ts extension for import paths)
const replacements = [];
for (const [dir, files] of Object.entries(mapping)) {
  for (const file of files) {
    const baseName = file.replace('.ts', '');
    replacements.push({
      oldPath: `@/lib/${baseName}`,
      newPath: `@/lib/${dir}/${baseName}`,
      fileName: file,
      newFileDir: dir
    });
  }
}

// 3. Move files
for (const replacement of replacements) {
  const oldFilePath = path.join(libDir, replacement.fileName);
  const newFilePath = path.join(libDir, replacement.newFileDir, replacement.fileName);
  
  if (fs.existsSync(oldFilePath)) {
    console.log(`Moving ${replacement.fileName} -> ${replacement.newFileDir}/${replacement.fileName}`);
    execSync(`git mv "${oldFilePath}" "${newFilePath}"`, { stdio: 'inherit' });
  }
}

// 4. Update imports
function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stats = fs.statSync(filepath);
    if (stats.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(file)) {
        walk(filepath, callback);
      }
    } else if (stats.isFile() && (filepath.endsWith('.ts') || filepath.endsWith('.tsx') || filepath.endsWith('.js'))) {
      callback(filepath);
    }
  }
}

const directoriesToScan = ['app', 'components', 'lib', 'tests', 'scripts', 'contexts', 'hooks', 'types'];

for (const dir of directoriesToScan) {
  walk(path.join(rootDir, dir), (filepath) => {
    let content = fs.readFileSync(filepath, 'utf8');
    let modified = false;

    for (const replacement of replacements) {
      // Regex to match exact import path, avoiding partial matches (e.g., matching @/lib/utils but not @/lib/utils-extra)
      // It matches quotes around the path
      const regex = new RegExp(`(['"\`])${replacement.oldPath}(['"\`])`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `$1${replacement.newPath}$2`);
        modified = true;
      }
    }

    if (modified) {
      console.log(`Updated imports in ${path.relative(rootDir, filepath)}`);
      fs.writeFileSync(filepath, content, 'utf8');
    }
  });
}

console.log('Refactoring complete!');
