/**
 * Utility functions for calculating latency test statistics.
 * Provides calculations for:
 * - Min/max/average values
 * - Median
 * - Standard deviation
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Stats } from './types';

export const calculateStats = (values: number[]): Stats => {
  const sorted = [...values].sort((a, b) => a - b);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  const squareDiffs = values.map((value) => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.round(Math.sqrt(avgSquareDiff));

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(avg),
    median: sorted[Math.floor(sorted.length / 2)],
    stdDev,
  };
};
