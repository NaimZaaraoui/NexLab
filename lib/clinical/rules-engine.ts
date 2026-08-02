export type TestOption = {
  id: string;
  code?: string | null;
};

export type RuleAction = 'ADD' | 'REMOVE';

export interface SelectionRule {
  id: string;
  description: string;
  // Les codes de tests qui déclenchent la règle
  triggerCodes: string[];
  // Les codes de tests à affecter
  targetCodes: string[];
  actionIfTriggerPresent: RuleAction;
  actionIfTriggerAbsent: RuleAction | 'NONE';
}

// Fonction utilitaire pour normaliser et extraire le code de base (ex: CHIMIE-CREA -> CREA)
function getBaseCode(code?: string | null): string {
  const normalized = (code || '').trim().toUpperCase();
  return normalized.includes('-') ? normalized.split('-').pop() || normalized : normalized;
}

// Les règles par défaut du laboratoire. 
// Dans le futur, ceci pourrait être chargé depuis la base de données (ex: lab_settings).
export const DEFAULT_LAB_RULES: SelectionRule[] = [
  {
    id: 'renal-egfr-auto',
    description: 'Auto-sélectionner le DFG quand la Créatinine est demandée',
    triggerCodes: ['CR', 'CREA', 'CREAT', 'CREATININE'],
    targetCodes: ['DFG', 'EGFR'],
    actionIfTriggerPresent: 'ADD',
    actionIfTriggerAbsent: 'REMOVE',
  }
];

export function applySelectionRules(selectedIds: string[], allTests: TestOption[], rules: SelectionRule[] = DEFAULT_LAB_RULES): string[] {
  const selectedSet = new Set(selectedIds);
  let hasChanges = false;

  // On crée un map pour accéder rapidement aux tests par leur code de base
  const testByBaseCode = new Map<string, TestOption[]>();
  for (const test of allTests) {
    const baseCode = getBaseCode(test.code);
    if (!testByBaseCode.has(baseCode)) {
      testByBaseCode.set(baseCode, []);
    }
    testByBaseCode.get(baseCode)!.push(test);
  }

  // Pour chaque règle, on évalue
  for (const rule of rules) {
    // 1. Est-ce que l'un des triggers est sélectionné ?
    let isTriggerPresent = false;
    for (const triggerCode of rule.triggerCodes) {
      const tests = testByBaseCode.get(triggerCode) || [];
      if (tests.some(t => selectedSet.has(t.id))) {
        isTriggerPresent = true;
        break;
      }
    }

    // 2. Trouver les tests cibles existants dans le dictionnaire
    const targetTests: TestOption[] = [];
    for (const targetCode of rule.targetCodes) {
      const tests = testByBaseCode.get(targetCode);
      if (tests) {
        targetTests.push(...tests);
      }
    }

    if (targetTests.length === 0) continue;

    // 3. Appliquer les actions
    if (isTriggerPresent) {
      if (rule.actionIfTriggerPresent === 'ADD') {
        targetTests.forEach(t => {
          if (!selectedSet.has(t.id)) {
            selectedSet.add(t.id);
            hasChanges = true;
          }
        });
      } else if (rule.actionIfTriggerPresent === 'REMOVE') {
        targetTests.forEach(t => {
          if (selectedSet.has(t.id)) {
            selectedSet.delete(t.id);
            hasChanges = true;
          }
        });
      }
    } else {
      if (rule.actionIfTriggerAbsent === 'ADD') {
        targetTests.forEach(t => {
          if (!selectedSet.has(t.id)) {
            selectedSet.add(t.id);
            hasChanges = true;
          }
        });
      } else if (rule.actionIfTriggerAbsent === 'REMOVE') {
        targetTests.forEach(t => {
          if (selectedSet.has(t.id)) {
            selectedSet.delete(t.id);
            hasChanges = true;
          }
        });
      }
    }
  }

  // S'il n'y a pas de changement, on retourne la référence originale
  return hasChanges ? Array.from(selectedSet) : selectedIds;
}
