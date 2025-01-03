/**
 * WebTransport is not included in this test because it requires a certificate
 * with a validity period not exceeding two weeks.
 *
 * Due to these operational complexities, only WebSocket and Long Polling are
 * supported and tested.
 */

import { NextResponse } from 'next/server';
import { io } from 'socket.io-client';

import { BASE_SERVER_URL } from '@/lib/constants';

export const dynamic = 'force-dynamic';

type Transport = 'websocket' | 'polling';

type LatencyMeasurements = {
  http: string | null;
  websocket: string | null;
  polling: string | null;
};

type LatencyErrors = {
  [key in keyof LatencyMeasurements]?: string;
};

interface LatencyResponse {
  success: boolean;
  timestamp: string;
  measurements: LatencyMeasurements;
  errors: LatencyErrors;
}

async function measureSocketLatency(transport: Transport): Promise<number> {
  return new Promise((resolve, reject) => {
    const socket = io(BASE_SERVER_URL, {
      transports: [transport],
      withCredentials: true,
      forceNew: true,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error(`${transport} connection timed out`));
    }, 5000);

    socket.on('connect', () => {
      const start = performance.now();
      socket.emit('ping');

      socket.on('pong', () => {
        clearTimeout(timeout);
        const latency = Math.round(performance.now() - start);
        socket.disconnect();
        resolve(latency);
      });
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      socket.disconnect();
      reject(new Error(`${transport} connection error: ${error.message}`));
    });
  });
}

export async function GET() {
  const results: LatencyResponse = {
    success: true,
    timestamp: new Date().toISOString(),
    measurements: {
      http: null,
      websocket: null,
      polling: null,
    },
    errors: {},
  };

  try {
    const httpStart = performance.now();
    const httpResponse = await fetch(BASE_SERVER_URL, {
      credentials: 'include',
    });

    if (!httpResponse.ok) {
      throw new Error('HTTP request failed');
    }

    results.measurements.http = `${Math.round(performance.now() - httpStart)}ms`;
  } catch (error) {
    results.errors.http =
      error instanceof Error ? error.message : 'Unknown error';
  }

  const transports: Transport[] = ['websocket', 'polling'];

  for (const transport of transports) {
    try {
      const latency = await measureSocketLatency(transport);
      results.measurements[transport] = `${latency}ms`;
    } catch (error) {
      results.errors[transport] =
        error instanceof Error ? error.message : 'Unknown error';
    }
  }

  if (Object.values(results.measurements).every((v) => v === null)) {
    results.success = false;
  }

  return NextResponse.json(results, {
    status: results.success ? 200 : 500,
  });
}
