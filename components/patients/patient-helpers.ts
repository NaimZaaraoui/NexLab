'use client';

export function calculatePatientAge(dateString: string | null) {
  if (!dateString) return 'N/A';
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
