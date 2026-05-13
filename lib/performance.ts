/**
 * lib/performance.ts
 * 
 * Performance monitoring and metrics collection
 * Tracks Web Vitals, API response times, and React component renders
 */

import React from 'react';

// ============================================================================
// WEB VITALS MONITORING
// ============================================================================

export interface WebVital {
  name: 'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

export interface PerformanceMetrics {
  webVitals: WebVital[];
  apiCalls: ApiMetric[];
  componentRenders: RenderMetric[];
  timestamp: number;
}

// ============================================================================
// API PERFORMANCE TRACKING
// ============================================================================

export interface ApiMetric {
  endpoint: string;
  method: ApiMethod;
  duration: number; // milliseconds
  statusCode: number;
  timestamp: number;
  percentile?: 'p50' | 'p95' | 'p99';
  error?: string;
}

export type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT' | 'INTERNAL';

/**
 * Middleware to track API response times
 * Can be attached to server actions or API routes
 */
export function trackApiMetric(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number,
  error?: string
): ApiMetric {
  const metric: ApiMetric = {
    endpoint,
    method: toApiMethod(method),
    duration,
    statusCode,
    timestamp: Date.now(),
    error,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development' && duration > 200) {
    console.warn(
      `[PERF] Slow API: ${method} ${endpoint} took ${duration}ms`
    );
  }

  // Store metric (could persist to file, database, or external service)
  if (typeof window === 'undefined') {
    // Server-side: log to file or monitoring service
    logServerMetric(metric);
  }

  return metric;
}

function toApiMethod(method: string): ApiMethod {
  const normalized = method.toUpperCase();

  if (
    normalized === 'GET' ||
    normalized === 'POST' ||
    normalized === 'PATCH' ||
    normalized === 'DELETE' ||
    normalized === 'PUT' ||
    normalized === 'INTERNAL'
  ) {
    return normalized;
  }

  return 'INTERNAL';
}

/**
 * Calculate percentiles from array of response times
 */
export function calculatePercentiles(
  durations: number[]
): Record<'p50' | 'p95' | 'p99', number> {
  const sorted = [...durations].sort((a, b) => a - b);
  const len = sorted.length;

  return {
    p50: sorted[Math.floor(len * 0.5)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)],
  };
}

// ============================================================================
// REACT COMPONENT RENDER TRACKING
// ============================================================================

export interface RenderMetric {
  componentName: string;
  duration: number; // milliseconds
  renderCount: number;
  timestamp: number;
}

/**
 * Hook to measure React component render time
 * Usage:
 *   useRenderMetrics('AnalysisResultRow', true);
 */
export function useRenderMetrics(
  componentName: string,
  enableLogging: boolean = false
) {
  const renderStartRef = React.useRef(Date.now());
  const renderCountRef = React.useRef(0);

  React.useEffect(() => {
    renderCountRef.current++;
    const renderEnd = Date.now();
    const duration = renderEnd - renderStartRef.current;

    if (enableLogging && duration > 50) {
      console.warn(
        `[PERF] Slow render: ${componentName} took ${duration}ms (render #${renderCountRef.current})`
      );
    }

    renderStartRef.current = renderEnd;
  });

  return {
    renderCount: renderCountRef.current,
    logMetric: () => ({
      componentName,
      duration: Date.now() - renderStartRef.current,
      renderCount: renderCountRef.current,
      timestamp: Date.now(),
    }),
  };
}

// ============================================================================
// TIMING UTILITIES
// ============================================================================

/**
 * Simple performance measurement wrapper
 * Usage:
 *   const duration = await measure('my-operation', async () => {
 *     return await someSlowFunction();
 *   });
 */
export async function measure<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;

    if (duration > 100) {
      console.log(`[PERF] ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[PERF] ${name} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Synchronous measurement (for lightweight operations)
 */
export function measureSync<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;

    if (duration > 10) {
      console.log(`[PERF] ${name} took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[PERF] ${name} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

// ============================================================================
// SERVER METRICS LOGGING
// ============================================================================

function logServerMetric(metric: ApiMetric) {
  const logEntry = {
    isoTimestamp: new Date().toISOString(),
    ...metric,
  };

  // In production, would send to monitoring service
  // For now, just log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[METRIC]', JSON.stringify(logEntry));
  }
}

/**
 * Parse memory usage stats
 * Usage: getMemoryUsage()
 */
export function getMemoryUsage() {
  if (typeof process === 'undefined') return null;

  const usage = process.memoryUsage();
  return {
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`, // Resident Set Size
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    arrayBuffers: `${Math.round(usage.arrayBuffers / 1024 / 1024)}MB`,
  };
}

// ============================================================================
// DATABASE QUERY PERFORMANCE
// ============================================================================

export interface QueryMetric {
  query: string;
  duration: number;
  timestamp: number;
  rowsAffected?: number;
}

/**
 * Track slow database queries
 * Should be integrated with Prisma's log option
 */
export function logSlowQuery(metric: QueryMetric) {
  if (process.env.NODE_ENV === 'development' && metric.duration > 100) {
    console.warn(
      `[PERF] Slow query (${metric.duration}ms): ${metric.query.substring(0, 100)}...`
    );
  }
}

// ============================================================================
// API MIDDLEWARE FOR PERFORMANCE TRACKING
// ============================================================================

/**
 * Middleware wrapper for API routes to automatically track performance
 * Usage in Next.js API routes:
 * 
 * export async function POST(request: Request) {
 *   return withPerformanceTracking('create-analysis', async () => {
 *     // Your API logic here
 *   });
 * }
 */
export async function withPerformanceTracking<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const startTime = performance.now();
  let statusCode = 200;
  let error: string | undefined;

  try {
    const result = await operation();
    const duration = performance.now() - startTime;

    trackApiMetric(operationName, 'INTERNAL', duration, statusCode);

    if (duration > 300) {
      console.warn(
        `[PERF] Slow operation: ${operationName} took ${duration.toFixed(2)}ms`,
        metadata
      );
    }

    return result;
  } catch (err) {
    statusCode = 500;
    error = err instanceof Error ? err.message : String(err);
    const duration = performance.now() - startTime;

    trackApiMetric(operationName, 'INTERNAL', duration, statusCode, error);
    console.error(`[PERF] Failed operation: ${operationName} after ${duration.toFixed(2)}ms`, err);

    throw err;
  }
}

// ============================================================================
// BATCH METRICS COLLECTION
// ============================================================================

class MetricsCollector {
  private metrics: ApiMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(flushIntervalMs: number = 30000) {
    // Auto-flush every 30 seconds
    this.flushInterval = setInterval(() => this.flush(), flushIntervalMs);
  }

  addMetric(metric: ApiMetric) {
    this.metrics.push(metric);
  }

  async flush() {
    if (this.metrics.length === 0) return;

    const metrics = [...this.metrics];
    this.metrics = [];

    try {
      if (process.env.METRICS_ENDPOINT) {
        await fetch(process.env.METRICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metrics, timestamp: Date.now() }),
        });
      }
    } catch (error) {
      console.error('[METRICS] Failed to flush metrics:', error);
      // Re-add metrics for next flush
      this.metrics.unshift(...metrics);
    }
  }

  stop() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    return this.flush();
  }

  getMetrics() {
    return [...this.metrics];
  }

  getSummary() {
    if (this.metrics.length === 0) return null;

    const durations = this.metrics.map(m => m.duration);
    const sorted = [...durations].sort((a, b) => a - b);

    return {
      totalRequests: this.metrics.length,
      successfulRequests: this.metrics.filter(m => m.statusCode < 400).length,
      failedRequests: this.metrics.filter(m => m.statusCode >= 400).length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
}

// Global metrics collector instance
export const metricsCollector = new MetricsCollector();

// ============================================================================
// RESOURCE ANALYSIS
// ============================================================================

/**
 * Analyze performance bottlenecks
 * Returns prioritized list of optimization targets
 */
export function analyzePerformanceBottlenecks(
  metrics: PerformanceMetrics
): string[] {
  const recommendations: string[] = [];

  // Check Web Vitals
  const poorVitals = metrics.webVitals.filter(v => v.rating === 'poor');
  if (poorVitals.length > 0) {
    recommendations.push(
      `⚠️  ${poorVitals.length} Web Vital(s) rated poor: ${poorVitals.map(v => v.name).join(', ')}`
    );
  }

  // Check slow API calls
  const slowCalls = metrics.apiCalls.filter(c => c.duration > 500);
  if (slowCalls.length > 0) {
    recommendations.push(
      `⚠️  ${slowCalls.length} slow API call(s) (>500ms): ${slowCalls.map(c => `${c.method} ${c.endpoint}`).join(', ')}`
    );
  }

  // Check slow renders
  const slowRenders = metrics.componentRenders.filter(c => c.duration > 100);
  if (slowRenders.length > 0) {
    recommendations.push(
      `⚠️  ${slowRenders.length} slow component render(s) (>100ms): ${slowRenders.map(c => c.componentName).join(', ')}`
    );
  }

  return recommendations;
}

export const performanceMetrics = {
  trackApiMetric,
  calculatePercentiles,
  useRenderMetrics,
  measure,
  measureSync,
  getMemoryUsage,
  logSlowQuery,
  analyzePerformanceBottlenecks,
};

declare global {
  interface Window {
    __PERF_METRICS?: PerformanceMetrics;
  }
}
