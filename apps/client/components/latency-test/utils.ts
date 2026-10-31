/**
 * Utility functions for calculating latency test statistics.
 * Provides calculations for:
 * - Min/max/average values
 * - Median
 * - Standard deviation
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Stats } from "./types";

export const calculateStats = (values: number[]): Stats => {
  const sorted = [...values].sort((a, b) => a - b);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  const squareDiffs = values.map((value) => (value - avg) ** 2);
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.round(Math.sqrt(avgSquareDiff));

  return {
    avg: Math.round(avg),
    max: sorted.at(-1) ?? 0,
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    stdDev,
  };
};
