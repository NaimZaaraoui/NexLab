const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (name.endsWith('.tsx') || name.endsWith('.ts')) {
      files.push(name);
    }
  }
  return files;
}

const files = [...getFiles(path.join(__dirname, '../components')), ...getFiles(path.join(__dirname, '../app'))];
let updatedFiles = 0;

const replacements = [
  { regex: /(?<!print:)bg-white\b/g, replacement: 'bg-[var(--color-surface)]' },
  { regex: /(?<!print:)bg-slate-50\b/g, replacement: 'bg-[var(--color-surface-muted)]' },
  { regex: /(?<!print:)bg-slate-100\b/g, replacement: 'bg-[var(--color-surface-muted)]' },
  { regex: /(?<!print:)border-slate-100\b/g, replacement: 'border-[var(--color-border)]' },
  { regex: /(?<!print:)border-slate-200\b/g, replacement: 'border-[var(--color-border)]' },
  { regex: /(?<!print:|hover:)text-slate-900\b/g, replacement: 'text-[var(--color-text)]' },
  { regex: /(?<!print:|hover:)text-slate-800\b/g, replacement: 'text-[var(--color-text)]' },
  { regex: /(?<!print:|hover:)text-slate-600\b/g, replacement: 'text-[var(--color-text-secondary)]' },
  { regex: /(?<!print:|hover:)text-slate-500\b/g, replacement: 'text-[var(--color-text-soft)]' },
  { regex: /(?<!hover:)text-indigo-600\b/g, replacement: 'text-[var(--color-accent)]' },
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(({ regex, replacement }) => {
    content = content.replace(regex, replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    updatedFiles++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`\nMigration complete. Updated ${updatedFiles} files.`);
