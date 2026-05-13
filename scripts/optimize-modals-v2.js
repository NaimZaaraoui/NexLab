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

  // Skip if scroll lock already injected
  if (content.includes('useScrollLock(')) return;

  // Find the component and its potential "open" prop
  const componentMatch = content.match(/export function (\w+)\(\{([^}]*)\}/);
  if (componentMatch) {
    const props = componentMatch[2];
    let lockProp = null;
    if (props.includes('showEntry')) lockProp = 'showEntry';
    else if (props.includes('show')) lockProp = 'show';
    else if (props.includes('isOpen')) lockProp = 'isOpen';
    else if (props.includes('open')) lockProp = 'open';
    else if (props.includes('mounted')) lockProp = 'mounted';

    if (lockProp) {
       // Inject hook call at the start of the function body
       content = content.replace(/(\) \{)/, `$1\n  useScrollLock(${lockProp});`);
    }
  }

  fs.writeFileSync(filePath, content);
  console.log(`Manually Injected ScrollLock: ${relPath}`);
});
