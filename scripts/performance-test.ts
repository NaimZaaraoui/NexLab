#!/usr/bin/env node

/**
 * scripts/performance-test.ts
 * 
 * Load testing and performance benchmarking suite
 * Usage: npx ts-node scripts/performance-test.ts [scenario]
 * 
 * Scenarios:
 *   - list-analyses     : Load test with concurrent analysis list requests
 *   - create-analysis   : Benchmark analysis creation
 *   - save-results      : Stress test result saving
 *   - pdf-generation    : Test PDF generation performance
 *   - concurrent-updates: Test concurrent status updates
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

interface TestResult {
  name: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
  requestsPerSecond: number;
  errors: { code: number; count: number }[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate percentiles from an array of values
 */
function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Format results for display
 */
function formatResults(result: TestResult): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Test Results: ${result.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`
Total Requests:      ${result.totalRequests}
Successful:          ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%)
Failed:              ${result.failedRequests}
Duration:            ${(result.totalDuration / 1000).toFixed(2)}s
Requests/sec:        ${result.requestsPerSecond.toFixed(2)}

Response Times:
  Average:           ${result.avgDuration.toFixed(2)}ms
  Min:               ${result.minDuration.toFixed(2)}ms
  Max:               ${result.maxDuration.toFixed(2)}ms
  p50:               ${result.p50.toFixed(2)}ms
  p95:               ${result.p95.toFixed(2)}ms
  p99:               ${result.p99.toFixed(2)}ms
  `);

  if (result.errors.length > 0) {
    console.log('Errors:');
    result.errors.forEach(error => {
      console.log(`  ${error.code}: ${error.count} occurrences`);
    });
  }
}

// ============================================================================
// LOAD TESTS
// ============================================================================

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * Scenario 1: List analyses (common read operation)
 */
async function testListAnalyses(
  concurrency: number = 50,
  duration: number = 10000
): Promise<TestResult> {
  const durations: number[] = [];
  const errorCounts: Map<number, number> = new Map();
  let successCount = 0;
  let failCount = 0;
  const startTime = performance.now();

  const makeRequest = async (): Promise<number> => {
    const start = performance.now();
    try {
      const response = await fetch(`${BASE_URL}/api/analyses?limit=50`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const elapsed = performance.now() - start;

      if (response.ok) {
        successCount++;
      } else {
        failCount++;
        errorCounts.set(response.status, (errorCounts.get(response.status) || 0) + 1);
      }

      return elapsed;
    } catch (error) {
      failCount++;
      errorCounts.set(500, (errorCounts.get(500) || 0) + 1);
      return performance.now() - start;
    }
  };

  // Run concurrent requests until duration expires
  while (performance.now() - startTime < duration) {
    const promises: Promise<number>[] = [];
    for (let i = 0; i < concurrency; i++) {
      promises.push(makeRequest());
    }
    const results = await Promise.all(promises);
    durations.push(...results);
  }

  const totalDuration = performance.now() - startTime;
  const totalRequests = successCount + failCount;

  return {
    name: 'List Analyses (50 concurrent, 10s duration)',
    totalRequests,
    successfulRequests: successCount,
    failedRequests: failCount,
    totalDuration,
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    p50: calculatePercentile(durations, 50),
    p95: calculatePercentile(durations, 95),
    p99: calculatePercentile(durations, 99),
    requestsPerSecond: (totalRequests / (totalDuration / 1000)),
    errors: Array.from(errorCounts, ([code, count]) => ({ code, count })),
  };
}

/**
 * Scenario 2: Save results (create/update operation under load)
 */
async function testSaveResults(
  concurrency: number = 20,
  duration: number = 10000
): Promise<TestResult> {
  const durations: number[] = [];
  const errorCounts: Map<number, number> = new Map();
  let successCount = 0;
  let failCount = 0;
  const startTime = performance.now();

  // Mock analysis ID (in real test, fetch actual ID first)
  const analysisId = 'test-analysis-001';

  const makeRequest = async (): Promise<number> => {
    const start = performance.now();
    try {
      const payload = {
        results: {
          'result-1': '100',
          'result-2': '8.5',
          'result-3': '95',
        },
        notes: {
          'result-1': 'Sample note',
        },
      };

      const response = await fetch(`${BASE_URL}/api/analyses/${analysisId}/results`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const elapsed = performance.now() - start;

      if (response.ok) {
        successCount++;
      } else {
        failCount++;
        errorCounts.set(response.status, (errorCounts.get(response.status) || 0) + 1);
      }

      return elapsed;
    } catch (error) {
      failCount++;
      errorCounts.set(500, (errorCounts.get(500) || 0) + 1);
      return performance.now() - start;
    }
  };

  while (performance.now() - startTime < duration) {
    const promises: Promise<number>[] = [];
    for (let i = 0; i < concurrency; i++) {
      promises.push(makeRequest());
    }
    const results = await Promise.all(promises);
    durations.push(...results);
  }

  const totalDuration = performance.now() - startTime;
  const totalRequests = successCount + failCount;

  return {
    name: 'Save Results (20 concurrent, 10s duration)',
    totalRequests,
    successfulRequests: successCount,
    failedRequests: failCount,
    totalDuration,
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    p50: calculatePercentile(durations, 50),
    p95: calculatePercentile(durations, 95),
    p99: calculatePercentile(durations, 99),
    requestsPerSecond: (totalRequests / (totalDuration / 1000)),
    errors: Array.from(errorCounts, ([code, count]) => ({ code, count })),
  };
}

/**
 * Scenario 3: PDF generation
 */
async function testPdfGeneration(
  concurrency: number = 5,
  iterations: number = 1
): Promise<TestResult> {
  const durations: number[] = [];
  const errorCounts: Map<number, number> = new Map();
  let successCount = 0;
  let failCount = 0;

  const analysisId = 'test-analysis-001';

  for (let i = 0; i < iterations; i++) {
    const promises: Promise<number>[] = [];

    for (let j = 0; j < concurrency; j++) {
      promises.push(
        (async (): Promise<number> => {
          const start = performance.now();
          try {
            const response = await fetch(
              `${BASE_URL}/api/analyses/${analysisId}?printToken=${process.env.PRINT_TOKEN || ''}`,
              { method: 'GET' }
            );
            const elapsed = performance.now() - start;

            if (response.ok) {
              successCount++;
            } else {
              failCount++;
              errorCounts.set(response.status, (errorCounts.get(response.status) || 0) + 1);
            }

            return elapsed;
          } catch (error) {
            failCount++;
            errorCounts.set(500, (errorCounts.get(500) || 0) + 1);
            return performance.now() - start;
          }
        })()
      );
    }

    const results = await Promise.all(promises);
    durations.push(...results);
  }

  const totalRequests = successCount + failCount;

  return {
    name: `PDF Generation (${concurrency} concurrent, ${iterations} iterations)`,
    totalRequests,
    successfulRequests: successCount,
    failedRequests: failCount,
    totalDuration: durations.reduce((a, b) => a + b, 0),
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    p50: calculatePercentile(durations, 50),
    p95: calculatePercentile(durations, 95),
    p99: calculatePercentile(durations, 99),
    requestsPerSecond: totalRequests / (durations.reduce((a, b) => a + b, 0) / 1000),
    errors: Array.from(errorCounts, ([code, count]) => ({ code, count })),
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const scenario = process.argv[2] || 'list-analyses';

  console.log(`🚀 Starting performance test: ${scenario}`);
  console.log(`📍 Target: ${BASE_URL}`);

  let result: TestResult;

  try {
    switch (scenario) {
      case 'list-analyses':
        result = await testListAnalyses(50, 10000);
        break;
      case 'save-results':
        result = await testSaveResults(20, 10000);
        break;
      case 'pdf-generation':
        result = await testPdfGeneration(5, 5);
        break;
      default:
        console.error(`❌ Unknown scenario: ${scenario}`);
        process.exit(1);
    }

    formatResults(result);

    // Check against targets
    const targets = {
      'list-analyses': { avgDuration: 200, p95: 300 },
      'save-results': { avgDuration: 150, p95: 300 },
      'pdf-generation': { avgDuration: 5000, p95: 6000 },
    };

    const target = targets[scenario as keyof typeof targets];
    if (target) {
      console.log(`\n📈 Target Comparison:`);
      console.log(
        `  Average: ${result.avgDuration.toFixed(2)}ms (target: ${target.avgDuration}ms) ${
          result.avgDuration <= target.avgDuration ? '✅' : '❌'
        }`
      );
      console.log(
        `  p95: ${result.p95.toFixed(2)}ms (target: ${target.p95}ms) ${
          result.p95 <= target.p95 ? '✅' : '❌'
        }`
      );
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
