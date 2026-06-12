/**
 * Centralized Error Handling System for NexLab
 * Provides structured error codes, recovery strategies, and user-facing messages
 */

export enum ErrorCode {
  // Validation Errors (4xx range)
  VALIDATION_FAILED = 'ERR_VALIDATION_001',
  INVALID_EMAIL = 'ERR_VALIDATION_002',
  INVALID_DATE = 'ERR_VALIDATION_003',
  INVALID_GENDER = 'ERR_VALIDATION_004',
  DUPLICATE_RECORD = 'ERR_VALIDATION_005',

  // Authentication Errors (4xx range)
  AUTH_REQUIRED = 'ERR_AUTH_001',
  INVALID_CREDENTIALS = 'ERR_AUTH_002',
  SESSION_EXPIRED = 'ERR_AUTH_003',
  INSUFFICIENT_PERMISSIONS = 'ERR_AUTH_004',
  TOKEN_INVALID = 'ERR_AUTH_005',

  // Database Errors (5xx range)
  DB_CONNECTION_FAILED = 'ERR_DB_001',
  DB_QUERY_FAILED = 'ERR_DB_002',
  DB_INTEGRITY_VIOLATION = 'ERR_DB_003',
  DB_MIGRATION_FAILED = 'ERR_DB_004',
  DB_LOCKED = 'ERR_DB_005',

  // Resource Errors (4xx range)
  NOT_FOUND = 'ERR_RESOURCE_001',
  RESOURCE_CONFLICT = 'ERR_RESOURCE_002',
  RESOURCE_DELETED = 'ERR_RESOURCE_003',

  // Operation Errors
  OPERATION_FAILED = 'ERR_OP_001',
  OPERATION_TIMEOUT = 'ERR_OP_002',
  OPERATION_CANCELLED = 'ERR_OP_003',

  // File/Export Errors
  FILE_EXPORT_FAILED = 'ERR_FILE_001',
  FILE_IMPORT_FAILED = 'ERR_FILE_002',
  PDF_GENERATION_FAILED = 'ERR_PDF_001',

  // External Service Errors
  EMAIL_SEND_FAILED = 'ERR_EMAIL_001',
  PRINT_SERVICE_UNAVAILABLE = 'ERR_PRINT_001',

  // Generic/Unknown Errors
  UNKNOWN_ERROR = 'ERR_UNKNOWN_001',
  NETWORK_ERROR = 'ERR_NETWORK_001',
}

export interface NexLabError extends Error {
  code: ErrorCode;
  statusCode: number;
  userMessage: string;
  recoveryAction?: string;
  originalError?: Error;
  timestamp: Date;
}

export class StructuredError extends Error implements NexLabError {
  code: ErrorCode;
  statusCode: number;
  userMessage: string;
  recoveryAction?: string;
  originalError?: Error;
  timestamp: Date;

  constructor(
    code: ErrorCode,
    statusCode: number,
    userMessage: string,
    options?: {
      recoveryAction?: string;
      originalError?: Error;
    }
  ) {
    super(`[${code}] ${userMessage}`);
    this.name = 'StructuredError';
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.recoveryAction = options?.recoveryAction;
    this.originalError = options?.originalError;
    this.timestamp = new Date();
  }
}

/**
 * Maps error codes to user-friendly French messages
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_FAILED]: 'Les données saisies ne sont pas valides',
  [ErrorCode.INVALID_EMAIL]: 'Adresse email invalide',
  [ErrorCode.INVALID_DATE]: 'Date invalide',
  [ErrorCode.INVALID_GENDER]: 'Genre invalide',
  [ErrorCode.DUPLICATE_RECORD]: 'Un enregistrement identique existe déjà',

  [ErrorCode.AUTH_REQUIRED]: 'Authentification requise',
  [ErrorCode.INVALID_CREDENTIALS]: 'Email ou mot de passe incorrect',
  [ErrorCode.SESSION_EXPIRED]: 'Votre session a expiré, veuillez vous reconnecter',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Vous n\'avez pas les permissions nécessaires',
  [ErrorCode.TOKEN_INVALID]: 'Jeton d\'authentification invalide',

  [ErrorCode.DB_CONNECTION_FAILED]: 'Impossible de se connecter à la base de données',
  [ErrorCode.DB_QUERY_FAILED]: 'Erreur lors de la requête base de données',
  [ErrorCode.DB_INTEGRITY_VIOLATION]: 'Les données violeraient les règles d\'intégrité',
  [ErrorCode.DB_MIGRATION_FAILED]: 'La migration de la base de données a échoué',
  [ErrorCode.DB_LOCKED]: 'Base de données actuellement verrouillée, réessayez',

  [ErrorCode.NOT_FOUND]: 'Ressource non trouvée',
  [ErrorCode.RESOURCE_CONFLICT]: 'Conflit lors de la mise à jour de la ressource',
  [ErrorCode.RESOURCE_DELETED]: 'Cette ressource a été supprimée',

  [ErrorCode.OPERATION_FAILED]: 'L\'opération a échoué',
  [ErrorCode.OPERATION_TIMEOUT]: 'L\'opération a pris trop de temps',
  [ErrorCode.OPERATION_CANCELLED]: 'L\'opération a été annulée',

  [ErrorCode.FILE_EXPORT_FAILED]: 'Erreur lors de l\'export du fichier',
  [ErrorCode.FILE_IMPORT_FAILED]: 'Erreur lors de l\'import du fichier',
  [ErrorCode.PDF_GENERATION_FAILED]: 'Erreur lors de la génération du PDF',

  [ErrorCode.EMAIL_SEND_FAILED]: 'Erreur lors de l\'envoi de l\'email',
  [ErrorCode.PRINT_SERVICE_UNAVAILABLE]: 'Service d\'impression indisponible',

  [ErrorCode.UNKNOWN_ERROR]: 'Une erreur inattendue s\'est produite',
  [ErrorCode.NETWORK_ERROR]: 'Erreur de connexion réseau',
};

/**
 * Maps error codes to recovery actions
 */
export const ERROR_RECOVERY_ACTIONS: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_FAILED]: 'Vérifiez les données et réessayez',
  [ErrorCode.INVALID_EMAIL]: 'Entrez une adresse email valide',
  [ErrorCode.INVALID_DATE]: 'Entrez une date valide (JJ/MM/YYYY)',
  [ErrorCode.INVALID_GENDER]: 'Sélectionnez M ou F',
  [ErrorCode.DUPLICATE_RECORD]: 'Vérifiez si cet enregistrement existe déjà',

  [ErrorCode.AUTH_REQUIRED]: 'Connectez-vous pour continuer',
  [ErrorCode.INVALID_CREDENTIALS]: 'Vérifiez votre email et mot de passe',
  [ErrorCode.SESSION_EXPIRED]: 'Reconnectez-vous',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Contactez l\'administrateur',
  [ErrorCode.TOKEN_INVALID]: 'Reconnectez-vous',

  [ErrorCode.DB_CONNECTION_FAILED]: 'Vérifiez votre connexion réseau et réessayez',
  [ErrorCode.DB_QUERY_FAILED]: 'Réessayez l\'opération',
  [ErrorCode.DB_INTEGRITY_VIOLATION]: 'Vérifiez les données et réessayez',
  [ErrorCode.DB_MIGRATION_FAILED]: 'Contactez l\'administrateur',
  [ErrorCode.DB_LOCKED]: 'Attendez quelques secondes et réessayez',

  [ErrorCode.NOT_FOUND]: 'Vérifiez l\'identifiant et réessayez',
  [ErrorCode.RESOURCE_CONFLICT]: 'La ressource a peut-être été modifiée, rechargez la page',
  [ErrorCode.RESOURCE_DELETED]: 'Cette ressource n\'existe plus',

  [ErrorCode.OPERATION_FAILED]: 'Réessayez l\'opération',
  [ErrorCode.OPERATION_TIMEOUT]: 'L\'opération était trop longue, réessayez',
  [ErrorCode.OPERATION_CANCELLED]: 'L\'opération a été annulée par l\'utilisateur',

  [ErrorCode.FILE_EXPORT_FAILED]: 'Vérifiez que vous avez l\'espace disque et réessayez',
  [ErrorCode.FILE_IMPORT_FAILED]: 'Vérifiez que le fichier est au bon format',
  [ErrorCode.PDF_GENERATION_FAILED]: 'Réessayez de générer le rapport',

  [ErrorCode.EMAIL_SEND_FAILED]: 'Vérifiez les paramètres d\'email et réessayez',
  [ErrorCode.PRINT_SERVICE_UNAVAILABLE]: 'Vérifiez que le service d\'impression est disponible',

  [ErrorCode.UNKNOWN_ERROR]: 'Réessayez l\'opération, contactez le support si le problème persiste',
  [ErrorCode.NETWORK_ERROR]: 'Vérifiez votre connexion internet et réessayez',
};

/**
 * HTTP status codes for error responses
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  [ErrorCode.VALIDATION_FAILED]: 400,
  [ErrorCode.INVALID_EMAIL]: 400,
  [ErrorCode.INVALID_DATE]: 400,
  [ErrorCode.INVALID_GENDER]: 400,
  [ErrorCode.DUPLICATE_RECORD]: 409,

  [ErrorCode.AUTH_REQUIRED]: 401,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.SESSION_EXPIRED]: 401,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.TOKEN_INVALID]: 401,

  [ErrorCode.DB_CONNECTION_FAILED]: 503,
  [ErrorCode.DB_QUERY_FAILED]: 500,
  [ErrorCode.DB_INTEGRITY_VIOLATION]: 409,
  [ErrorCode.DB_MIGRATION_FAILED]: 500,
  [ErrorCode.DB_LOCKED]: 503,

  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_CONFLICT]: 409,
  [ErrorCode.RESOURCE_DELETED]: 404,

  [ErrorCode.OPERATION_FAILED]: 500,
  [ErrorCode.OPERATION_TIMEOUT]: 408,
  [ErrorCode.OPERATION_CANCELLED]: 400,

  [ErrorCode.FILE_EXPORT_FAILED]: 500,
  [ErrorCode.FILE_IMPORT_FAILED]: 400,
  [ErrorCode.PDF_GENERATION_FAILED]: 500,

  [ErrorCode.EMAIL_SEND_FAILED]: 500,
  [ErrorCode.PRINT_SERVICE_UNAVAILABLE]: 503,

  [ErrorCode.UNKNOWN_ERROR]: 500,
  [ErrorCode.NETWORK_ERROR]: 503,
};

/**
 * Creates a structured error response
 */
export function createErrorResponse(
  code: ErrorCode,
  options?: {
    recoveryAction?: string;
    originalError?: Error;
  }
): StructuredError {
  const statusCode = ERROR_STATUS_CODES[code];
  const userMessage = ERROR_MESSAGES[code];
  const defaultRecoveryAction = ERROR_RECOVERY_ACTIONS[code];

  return new StructuredError(code, statusCode, userMessage, {
    recoveryAction: options?.recoveryAction || defaultRecoveryAction,
    originalError: options?.originalError,
  });
}

/**
 * Formats error for JSON response
 */
export function formatErrorResponse(error: StructuredError) {
  return {
    error: {
      code: error.code,
      message: error.userMessage,
      recoveryAction: error.recoveryAction,
      timestamp: error.timestamp.toISOString(),
    },
  };
}

/**
 * Safely logs error to console and file (avoid logging sensitive data)
 */
export function logError(error: StructuredError | Error) {
  const timestamp = new Date().toISOString();

  if (error instanceof StructuredError) {
    console.error(`[${timestamp}] ${error.code}: ${error.message}`);
    if (error.originalError) {
      console.error('Original error:', error.originalError.message);
    }
  } else {
    console.error(`[${timestamp}] Unexpected error: ${error.message}`);
  }

  // TODO: Send to centralized logging service (e.g., Sentry, DataDog)
}

/**
 * Determines if error is retryable
 */
export function isRetryable(error: StructuredError): boolean {
  const retryableCodes = [
    ErrorCode.DB_LOCKED,
    ErrorCode.OPERATION_TIMEOUT,
    ErrorCode.NETWORK_ERROR,
    ErrorCode.DB_CONNECTION_FAILED,
  ];

  return retryableCodes.includes(error.code);
}

/**
 * Implements exponential backoff retry logic
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;

      if (error instanceof StructuredError && !isRetryable(error)) {
        throw error;
      }

      const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error('Max retry attempts exceeded');
}
