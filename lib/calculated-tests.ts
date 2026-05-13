import { formatLocaleNumber, parseLocaleNumber } from '@/lib/calculations';
import type { Analysis, Result, Test } from '@/lib/types';

export type FormulaValidationResult = {
  valid: boolean;
  dependencies: string[];
  error?: string;
};

export type FormulaEvaluationError =
  | 'missing_dependency'
  | 'invalid_number'
  | 'division_by_zero'
  | 'invalid_formula';

export type FormulaEvaluationResult = {
  ok: boolean;
  value: string | null;
  error?: FormulaEvaluationError;
};

type FormulaToken =
  | { type: 'number'; value: number }
  | { type: 'identifier'; value: string }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' }
  | { type: 'paren'; value: '(' | ')' };

type FormulaTestLike = Pick<Test, 'code' | 'resultType' | 'options' | 'decimals' | 'isGroup'>;

export function isCalculatedFormulaTest(test?: FormulaTestLike | null): boolean {
  return Boolean(test && test.resultType === 'calculated' && test.options?.trim());
}

export function extractFormulaDependencies(formula: string): string[] {
  const trimmed = formula.trim();
  if (!trimmed) {
    return [];
  }

  const tokens = tokenizeFormula(trimmed);
  return Array.from(
    new Set(
      tokens
        .filter((token): token is Extract<FormulaToken, { type: 'identifier' }> => token.type === 'identifier')
        .map((token) => token.value)
    )
  );
}

export function validateFormula(
  formula: string,
  availableTests: FormulaTestLike[],
  currentTestCode?: string
): FormulaValidationResult {
  const trimmed = formula.trim();
  if (!trimmed) {
    return { valid: false, dependencies: [], error: 'La formule est obligatoire.' };
  }

  let tokens: FormulaToken[];
  try {
    tokens = tokenizeFormula(trimmed);
  } catch (error) {
    return {
      valid: false,
      dependencies: [],
      error: error instanceof Error ? error.message : 'Formule invalide.',
    };
  }

  const dependencies = Array.from(
    new Set(
      tokens
        .filter((token): token is Extract<FormulaToken, { type: 'identifier' }> => token.type === 'identifier')
        .map((token) => token.value)
    )
  );

  if (dependencies.length === 0) {
    return { valid: false, dependencies: [], error: 'La formule doit référencer au moins un test.' };
  }

  const normalizedCurrentCode = currentTestCode?.trim().toUpperCase();
  if (normalizedCurrentCode && dependencies.includes(normalizedCurrentCode)) {
    return { valid: false, dependencies, error: 'Un test calculé ne peut pas se référencer lui-même.' };
  }

  const availableByCode = new Map(availableTests.map((test) => [test.code.trim().toUpperCase(), test]));

  for (const dependency of dependencies) {
    const dependencyTest = availableByCode.get(dependency);
    if (!dependencyTest) {
      return { valid: false, dependencies, error: `Le test source "${dependency}" est introuvable.` };
    }

    if (dependencyTest.isGroup) {
      return {
        valid: false,
        dependencies,
        error: `La formule ne peut pas dépendre d'un panel (${dependency}).`,
      };
    }

    if (dependencyTest.resultType === 'calculated') {
      return {
        valid: false,
        dependencies,
        error: `La formule ne peut pas dépendre d'un autre test calculé (${dependency}).`,
      };
    }

    if (dependencyTest.resultType !== 'numeric') {
      return {
        valid: false,
        dependencies,
        error: `Le test source "${dependency}" doit être numérique.`,
      };
    }
  }

  try {
    toRpn(tokens);
  } catch (error) {
    return {
      valid: false,
      dependencies,
      error: error instanceof Error ? error.message : 'Formule invalide.',
    };
  }

  return {
    valid: true,
    dependencies,
  };
}

export function evaluateFormula(
  formula: string,
  valuesByCode: Record<string, string | null | undefined>,
  decimals: number = 1
): FormulaEvaluationResult {
  try {
    const tokens = tokenizeFormula(formula);
    const rpn = toRpn(tokens);
    const stack: number[] = [];

    for (const token of rpn) {
      if (token.type === 'number') {
        stack.push(token.value);
        continue;
      }

      if (token.type === 'identifier') {
        const raw = valuesByCode[token.value];
        if (!raw) {
          return { ok: false, value: null, error: 'missing_dependency' };
        }
        const parsed = parseLocaleNumber(raw);
        if (parsed === null) {
          return { ok: false, value: null, error: 'invalid_number' };
        }
        stack.push(parsed);
        continue;
      }

      if (token.type === 'operator') {
        const right = stack.pop();
        const left = stack.pop();
        if (left === undefined || right === undefined) {
          return { ok: false, value: null, error: 'invalid_formula' };
        }

        switch (token.value) {
          case '+':
            stack.push(left + right);
            break;
          case '-':
            stack.push(left - right);
            break;
          case '*':
            stack.push(left * right);
            break;
          case '/':
            if (right === 0) {
              return { ok: false, value: null, error: 'division_by_zero' };
            }
            stack.push(left / right);
            break;
        }
      }
    }

    if (stack.length !== 1 || !Number.isFinite(stack[0])) {
      return { ok: false, value: null, error: 'invalid_formula' };
    }

    return {
      ok: true,
      value: formatLocaleNumber(stack[0], decimals),
    };
  } catch {
    return { ok: false, value: null, error: 'invalid_formula' };
  }
}

export function applyCalculatedTestFormulas(
  analysis: Analysis | null,
  currentResults: Record<string, string>
): Record<string, string> {
  if (!analysis) return currentResults;

  const updatedResults = { ...currentResults };
  const valuesByCode = buildValuesByCode(analysis.results, updatedResults);

  for (const result of analysis.results) {
    const test = result.test;
    if (!test || !isCalculatedFormulaTest(test)) continue;
    const formulaTest = test;

    const evaluation = evaluateFormula(formulaTest.options || '', valuesByCode, formulaTest.decimals ?? 1);
    if (evaluation.ok) {
      updatedResults[result.id] = evaluation.value || '';
      valuesByCode[formulaTest.code.toUpperCase()] = evaluation.value || '';
    } else {
      updatedResults[result.id] = '';
      valuesByCode[formulaTest.code.toUpperCase()] = '';
    }
  }

  return updatedResults;
}

function buildValuesByCode(results: Result[], values: Record<string, string>) {
  return results.reduce<Record<string, string>>((acc, result) => {
    if (result.test?.code) {
      acc[result.test.code.toUpperCase()] = values[result.id] || '';
    }
    return acc;
  }, {});
}

function tokenizeFormula(formula: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  let index = 0;

  while (index < formula.length) {
    const char = formula[index];

    if (/\s/.test(char)) {
      index++;
      continue;
    }

    if (/[()+\-*/]/.test(char)) {
      if (char === '(' || char === ')') {
        tokens.push({ type: 'paren', value: char });
      } else if (
        char === '-' &&
        shouldTreatAsUnary(tokens[tokens.length - 1])
      ) {
        const numberMatch = formula.slice(index).match(/^-\d+(?:[.,]\d+)?/);
        if (!numberMatch) {
          throw new Error('Utilisez des nombres ou codes valides après le signe "-".');
        }
        tokens.push({
          type: 'number',
          value: Number(numberMatch[0].replace(',', '.')),
        });
        index += numberMatch[0].length;
        continue;
      } else {
        tokens.push({ type: 'operator', value: char as '+' | '-' | '*' | '/' });
      }
      index++;
      continue;
    }

    const numberMatch = formula.slice(index).match(/^\d+(?:[.,]\d+)?/);
    if (numberMatch) {
      tokens.push({
        type: 'number',
        value: Number(numberMatch[0].replace(',', '.')),
      });
      index += numberMatch[0].length;
      continue;
    }

    const identifierMatch = formula.slice(index).match(/^[A-Za-z][A-Za-z0-9_%]*/);
    if (identifierMatch) {
      tokens.push({
        type: 'identifier',
        value: identifierMatch[0].toUpperCase(),
      });
      index += identifierMatch[0].length;
      continue;
    }

    throw new Error(`Caractère non autorisé dans la formule: "${char}"`);
  }

  return tokens;
}

function toRpn(tokens: FormulaToken[]): Array<Extract<FormulaToken, { type: 'number' | 'identifier' | 'operator' }>> {
  const output: Array<Extract<FormulaToken, { type: 'number' | 'identifier' | 'operator' }>> = [];
  const operators: FormulaToken[] = [];
  const precedence: Record<'+' | '-' | '*' | '/', number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

  for (const token of tokens) {
    if (token.type === 'number' || token.type === 'identifier') {
      output.push(token);
      continue;
    }

    if (token.type === 'operator') {
      while (true) {
        const top = operators[operators.length - 1];
        if (!top || top.type !== 'operator') break;
        if (precedence[top.value] < precedence[token.value]) break;
        output.push(operators.pop() as Extract<FormulaToken, { type: 'operator' }>);
      }
      operators.push(token);
      continue;
    }

    if (token.value === '(') {
      operators.push(token);
      continue;
    }

    while (operators.length > 0 && operators[operators.length - 1]?.type !== 'paren') {
      output.push(operators.pop() as Extract<FormulaToken, { type: 'operator' }>);
    }

    const last = operators.pop();
    if (!last || last.type !== 'paren' || last.value !== '(') {
      throw new Error('Parenthèses non équilibrées dans la formule.');
    }
  }

  while (operators.length > 0) {
    const operator = operators.pop();
    if (!operator) break;
    if (operator.type === 'paren') {
      throw new Error('Parenthèses non équilibrées dans la formule.');
    }
    output.push(operator);
  }

  return output;
}

function shouldTreatAsUnary(previousToken?: FormulaToken) {
  if (!previousToken) return true;
  if (previousToken.type === 'operator') return true;
  return previousToken.type === 'paren' && previousToken.value === '(';
}
