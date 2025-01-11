/**
 * Latency test page component that measures connection speed to server.
 * Features:
 * - Round-trip latency test
 * - Connection status display
 * - Results visualization
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Metadata } from 'next';

import { LATENCY_TEST_DESCRIPTION, LATENCY_TEST_TITLE } from '@/lib/constants';
import { LatencyTest } from '@/components/latency-test';

export const metadata: Metadata = {
  title: LATENCY_TEST_TITLE,
  description: LATENCY_TEST_DESCRIPTION,
};

export default function LatencyTestPage() {
  return (
    <div className="container mx-auto p-4">
      <LatencyTest />
    </div>
  );
}
