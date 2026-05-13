'use client';

export type AuditItem = {
  id: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AuditResponse = {
  items: AuditItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
