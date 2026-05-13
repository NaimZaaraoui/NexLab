const fs = require('fs');
const path = require('path');

const files = [
  'components/temperature/RecordReadingModal.tsx',
  'components/temperature/TemperatureEditModal.tsx',
  'components/temperature/TemperatureInvalidateModal.tsx',
  'components/bilans/BilanEditorModal.tsx',
  'components/tests/TestInventoryRulesModal.tsx',
  'components/tests/TestEditorModal.tsx',
  'components/tests/ordering/CategoryFormModal.tsx',
  'components/inventory/InventoryModalShell.tsx',
  'components/inventory/InventoryCategoryManagerModal.tsx',
  'components/qc/QcTestSelectorModal.tsx',
  'components/qc/QcLotEditModal.tsx',
  'components/qc/QcEntryModal.tsx',
  'components/audit/AuditLogDetailsModal.tsx'
];

files.forEach(relPath => {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add import
  if (!content.includes('import { useScrollLock }')) {
    const importMatch = content.match(/import.*;/);
    if (importMatch) {
      content = content.replace(/(import.*;\n)/, `$1import { useScrollLock } from '@/hooks/useScrollLock';\n`);
    }
  }

  // 2. Inject hook call
  // We need to find the component start and its isOpen/open prop
  // Most of these follow the pattern export function Name({ open, ... })
  // or export function Name({ isOpen, ... })
  const componentMatch = content.match(/export function (\w+)\(\{([^}]*)\}/);
  if (componentMatch) {
    const props = componentMatch[2];
    const lockProp = props.includes('isOpen') ? 'isOpen' : (props.includes('open') ? 'open' : null);
    
    if (lockProp && !content.includes('useScrollLock(')) {
       // Find the start of the function body
       content = content.replace(/(export function \w+\([^)]*\) \{)/, `$1\n  useScrollLock(${lockProp});`);
    }
  }

  // 3. Strip heavy animations from className
  // e.g. animate-in zoom-in-95 slide-in-from-bottom-4 duration-300
  content = content.replace(/\banimate-in\b/g, '');
  content = content.replace(/\bzoom-in-\d+\b/g, '');
  content = content.replace(/\bslide-in-from-\w+-\d+\b/g, '');
  content = content.replace(/\bduration-\d+\b/g, '');
  content = content.replace(/\bfade-in\b/g, '');

  fs.writeFileSync(filePath, content);
  console.log(`Optimized: ${relPath}`);
});
