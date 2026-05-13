import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Test } from "./types"

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
