'use client';

export interface HeaderSearchResult {
  id: string;
  title: string;
  type: 'patient' | 'analysis' | 'result';
  description?: string;
}

export interface HeaderNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  isRead: boolean;
  analysisId?: string;
  createdAt: Date;
}

export interface HeaderQcSummary {
  allPass: boolean;
  missing: number;
  warn: number;
  fail: number;
}
