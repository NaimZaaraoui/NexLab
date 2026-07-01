import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Test, Result } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTestReferenceValues(test: Test, gender: string | null | undefined) {
  // Get gender-specific values if available and gender is provided
  const genderLower = gender?.toLowerCase().trim();
  
  if (genderLower === 'homme' || genderLower === 'h' || genderLower === 'm' || genderLower === 'male') {
    if (test.minValueM !== null || test.maxValueM !== null) {
      return { min: test.minValueM, max: test.maxValueM };
    }
  } else if (genderLower === 'femme' || genderLower === 'f' || genderLower === 'female') {
    if (test.minValueF !== null || test.maxValueF !== null) {
      return { min: test.minValueF, max: test.maxValueF };
    }
  }
  
  // Fall back to general values
  return { min: test.minValue, max: test.maxValue };
}

export function getResultReferenceValues(result: Result, gender: string | null | undefined) {
  let metadata: unknown = result.metadata;

  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch {
      metadata = undefined;
    }
  }

  if (metadata && typeof metadata === 'object' && 'reference' in metadata) {
    const reference = (metadata as any).reference;
    if (typeof reference === 'object') {
      const min = typeof reference.min === 'number' ? reference.min : null;
      const max = typeof reference.max === 'number' ? reference.max : null;
      // S'il y a des valeurs min/max figées, on les utilise en priorité
      if (min !== null || max !== null || reference.text) {
        return { min, max };
      }
    }
  }

  // Fallback au catalogue des tests (comportement d'origine)
  if (!result.test) {
    return { min: null, max: null };
  }
  return getTestReferenceValues(result.test, gender);
}

export function formatReferenceRange(min: number | null, max: number | null): string {
  if (min !== null && max !== null) {
    return `${min} - ${max}`;
  } else if (min !== null) {
    return `> ${min}`;
  } else if (max !== null) {
    return `< ${max}`;
  } else {
    return 'QUALIT.';
  }
}
