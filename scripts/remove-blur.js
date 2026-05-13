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

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Remove backdrop-blur-* classes completely
  content = content.replace(/\bbackdrop-blur-(sm|md|lg|xl)\b/g, '');
  content = content.replace(/\bbackdrop-blur\b/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    updatedFiles++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`\nBlur removal complete. Updated ${updatedFiles} files.`);
