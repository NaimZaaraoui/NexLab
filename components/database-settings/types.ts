'use client';

export type BackupItem = {
  fileName: string;
  size: number;
  createdAt: string;
  absolutePath: string;
};

export type DatabaseFileValidationStatus = {
  validationOk: boolean;
  restoreTestOk?: boolean;
};

export type BackupsResponse = {
  databasePath: string;
  backupDirectory: string;
  items: BackupItem[];
};

export type RecoveryBundlesResponse = {
  recoveryDirectory: string;
  items: BackupItem[];
};

export type HealthResponse = {
  database: {
    reachable: boolean;
    fileExists: boolean;
    path: string;
    size: number | null;
  };
  backups: {
    count: number;
    latestCreatedAt: string | null;
    isFresh: boolean;
    latestValidation: {
      valid: boolean;
      issues: string[];
    } | null;
    freeSpaceBytes: number | null;
  };
  recoveryBundles: {
    count: number;
    latestCreatedAt: string | null;
    latestValidation: {
      valid: boolean;
      issues: string[];
      entries: string[];
    } | null;
  };
  testHistory: {
    lastBackupTestAt: string | null;
    lastBackupTestOk: boolean | null;
    lastRecoveryTestAt: string | null;
    lastRecoveryTestOk: boolean | null;
  };
  externalTarget: {
    configuredPath: string;
    available: boolean;
  };
  maintenance: {
    enabled: boolean;
  };
  criticalLogs: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    createdAt: string;
  }>;
};

export type DatabaseAuditItem = {
  id: string;
  action: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  entity: string;
  entityId: string | null;
  userName: string | null;
  createdAt: string;
};

export type DatabaseAuditResponse = {
  items: DatabaseAuditItem[];
};

export type RestoreModalState =
  | {
      isOpen: false;
      kind: null;
      fileName: null;
    }
  | {
      isOpen: true;
      kind: 'backup' | 'bundle';
      fileName: string;
    };

export type RestoreSummary = {
  kind: 'backup' | 'bundle';
  restoredFrom: string;
  safetyFileName: string;
  restoredUploads?: boolean;
  validation: {
    valid: boolean;
    issues: string[];
  } | null;
  restoredAt: string;
};
