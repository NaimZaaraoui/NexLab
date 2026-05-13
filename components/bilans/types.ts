'use client';

export interface BilanTest {
  id: string;
  name: string;
  code: string;
  category: string | null;
}

export interface BilanItem {
  id: string;
  name: string;
  code?: string | null;
  tests: BilanTest[];
}
