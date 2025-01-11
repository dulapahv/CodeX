/**
 * Type definitions for latency test results and statistics.
 * Includes:
 * - Test result data structure
 * - Statistical calculation types
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export type TestResult = {
  id: number;
  http: number;
  socket: number;
  timestamp: string;
};

export type Stats = {
  min: number;
  max: number;
  avg: number;
  median: number;
  stdDev: number;
};
