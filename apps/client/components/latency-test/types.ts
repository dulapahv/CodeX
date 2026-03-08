/**
 * Type definitions for latency test results and statistics.
 * Includes:
 * - Test result data structure
 * - Statistical calculation types
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export interface TestResult {
  http: number;
  id: number;
  socket: number;
  timestamp: string;
}

export interface Stats {
  avg: number;
  max: number;
  median: number;
  min: number;
  stdDev: number;
}
