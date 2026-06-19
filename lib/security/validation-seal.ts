import crypto from 'crypto';

interface SealResult {
  id: string;
  value: string | null;
  unit: string | null;
  abnormal: boolean;
  metadata: string | null;
}

interface SealAnalysis {
  id: string;
  patientId: string | null;
  orderNumber: string;
}

/**
 * Génère un sceau cryptographique (HMAC SHA-256) pour figer un dossier médical.
 * Utilisé au moment de la validation biologique pour garantir l'intégrité des résultats.
 */
export function generateValidationHash(analysis: SealAnalysis, results: SealResult[]): string {
  // Trier les résultats par ID pour garantir un ordre constant lors de la sérialisation
  const sortedResults = [...results].sort((a, b) => a.id.localeCompare(b.id));
  
  const payload = {
    analysisId: analysis.id,
    patientId: analysis.patientId,
    orderNumber: analysis.orderNumber,
    results: sortedResults.map(r => ({
      id: r.id,
      value: r.value,
      unit: r.unit,
      abnormal: r.abnormal,
      metadata: r.metadata
    }))
  };

  const dataString = JSON.stringify(payload);
  // Utilisation du AUTH_SECRET comme clé de HMAC. S'il change, les anciens sceaux seront invalidés.
  // C'est pourquoi en production on pourrait avoir une clé spécifique "SEAL_SECRET".
  const secret = process.env.SEAL_SECRET;
  if (!secret) {
    console.error(
      '[NexLab] CRITICAL: SEAL_SECRET environment variable is not set. ' +
      'Validation hashes cannot be trusted. Set SEAL_SECRET in your .env file.'
    );
    // Return a clearly invalid hash so verifyValidationHash() will always fail
    // until the environment is properly configured.
    return 'INVALID_NO_SEAL_SECRET_CONFIGURED';
  }
  
  return crypto.createHmac('sha256', secret).update(dataString).digest('hex');
}

/**
 * Vérifie si le sceau cryptographique correspond toujours aux données actuelles.
 * Retourne true si les données sont intègres, false si elles ont été altérées.
 */
export function verifyValidationHash(analysis: SealAnalysis & { validationHash: string | null }, results: SealResult[]): boolean {
  if (!analysis.validationHash) return false;
  const expectedHash = generateValidationHash(analysis, results);
  return analysis.validationHash === expectedHash;
}
