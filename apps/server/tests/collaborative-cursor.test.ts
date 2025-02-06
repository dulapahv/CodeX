/**
 * Tests for measuring cursor synchronization latency in collaborative editing.
 * Tests both simple cursor movements and selection operations.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

import { io as Client } from 'socket.io-client';

import { CodeServiceMsg, RoomServiceMsg } from '@codex/types/message';
import type { Cursor } from '@codex/types/operation';

const SERVER_URL = process.env.SERVER_URL;
const SAMPLES_PER_TEST = 50;

const testCases = [
  {
    name: 'Simple cursor movement',
    cursor: [1, 1] as Cursor,
    description: 'Basic cursor position update at start of document',
  },
  {
    name: 'Long-distance cursor jump',
    cursor: [100, 50] as Cursor,
    description: 'Cursor movement to a distant position',
  },
  {
    name: 'Simple text selection',
    cursor: [1, 1, 1, 1, 1, 10] as Cursor,
    description: 'Selection within a single line',
  },
  {
    name: 'Multi-line selection',
    cursor: [1, 1, 1, 1, 5, 10] as Cursor,
    description: 'Selection spanning multiple lines',
  },
  {
    name: 'Large text selection',
    cursor: [1, 1, 1, 1, 100, 100] as Cursor,
    description: 'Selection of a large portion of text',
  },
];

interface TestResult {
  name: string;
  samples: number[];
  average: number;
  standardDeviation: number;
  minimum: number;
  maximum: number;
  description: string;
}

class CursorLatencyReport {
  private results: TestResult[] = [];
  private rapidMovementResults: TestResult | null = null;

  addResult(result: TestResult) {
    this.results.push(result);
  }

  setRapidMovementResult(result: TestResult) {
    this.rapidMovementResults = result;
  }

  private formatNumber(num: number): string {
    return num.toFixed(2);
  }

  private generateTestCaseReport(result: TestResult): string {
    return `Test Case: ${result.name}
─────────────────────────────────────────────────────
Description: ${result.description}
Samples: ${result.samples.map((s) => this.formatNumber(s)).join(', ')} ms

Statistics:
• Average Latency:      ${this.formatNumber(result.average)} ms
• Standard Deviation:   ${this.formatNumber(result.standardDeviation)} ms
• Minimum Latency:      ${this.formatNumber(result.minimum)} ms
• Maximum Latency:      ${this.formatNumber(result.maximum)} ms
`;
  }

  generateReport(): string {
    const timestamp = new Date().toISOString();
    return `Cursor Synchronization Latency Analysis Report
═══════════════════════════════════════════════════════════════
Timestamp: ${timestamp}
Server URL: ${SERVER_URL}
Number of Test Cases: ${this.results.length}
Samples per Test: ${SAMPLES_PER_TEST}

Individual Test Results
═══════════════════════════════════════════════════════════════
${this.results.map((r) => this.generateTestCaseReport(r)).join('\n')}

${this.rapidMovementResults ? this.generateTestCaseReport(this.rapidMovementResults) : ''}

Summary Statistics
═══════════════════════════════════════════════════════════════
Overall Average Latency: ${this.formatNumber(
      this.results.reduce((acc, r) => acc + r.average, 0) / this.results.length,
    )} ms
Best Performance: ${this.formatNumber(
      Math.min(...this.results.map((r) => r.minimum)),
    )} ms
Worst Performance: ${this.formatNumber(
      Math.max(...this.results.map((r) => r.maximum)),
    )} ms
`;
  }

  saveToFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir);
    }
    const filename = path.join(reportDir, `cursor-latency-${timestamp}.txt`);
    fs.writeFileSync(filename, this.generateReport());
    console.log(`Report saved to: ${filename}`);
  }
}

describe('Cursor Synchronization Latency Tests', () => {
  let senderSocket: ReturnType<typeof Client>;
  let receiverSocket: ReturnType<typeof Client>;
  let roomId: string;
  const report = new CursorLatencyReport();

  const createSocket = () => Client(SERVER_URL);

  beforeAll(async () => {
    // Create sender socket and room
    senderSocket = createSocket();
    await new Promise<void>((resolve, reject) => {
      senderSocket.on('connect_error', (error) => reject(error));
      senderSocket.on('connect', () => {
        resolve();
      });
    });

    // Create room
    await new Promise<void>((resolve, reject) => {
      senderSocket.emit(RoomServiceMsg.CREATE, 'Sender');
      senderSocket.once(RoomServiceMsg.CREATE, (receivedRoomId: string) => {
        roomId = receivedRoomId;
        resolve();
      });
    });

    // Setup receiver
    receiverSocket = createSocket();
    await new Promise<void>((resolve, reject) => {
      receiverSocket.on('connect_error', (error) => reject(error));
      receiverSocket.on('connect', () => {
        resolve();
      });
    });

    // Join room
    await new Promise<void>((resolve, reject) => {
      receiverSocket.emit(RoomServiceMsg.JOIN, roomId, 'Receiver');
      receiverSocket.once(RoomServiceMsg.JOIN, () => {
        resolve();
      });
    });

    // Warmup connection
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1000);
    });
  }, 130000);

  afterAll(() => {
    report.saveToFile();
    senderSocket?.disconnect();
    receiverSocket?.disconnect();
  });

  const measureLatency = async (cursor: Cursor): Promise<number[]> => {
    const latencies: number[] = [];

    for (let i = 0; i < SAMPLES_PER_TEST; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Delay between samples

      const startTime = performance.now();
      await new Promise<void>((resolve) => {
        receiverSocket.once(CodeServiceMsg.UPDATE_CURSOR, () => {
          const latency = performance.now() - startTime;
          latencies.push(latency);
          resolve();
        });
        senderSocket.emit(CodeServiceMsg.UPDATE_CURSOR, cursor);
      });
    }

    return latencies;
  };

  const calculateStats = (
    samples: number[],
  ): {
    average: number;
    standardDeviation: number;
    minimum: number;
    maximum: number;
  } => {
    const average = samples.reduce((a, b) => a + b) / samples.length;
    const standardDeviation = Math.sqrt(
      samples.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) /
        samples.length,
    );
    return {
      average,
      standardDeviation,
      minimum: Math.min(...samples),
      maximum: Math.max(...samples),
    };
  };

  test.each(testCases)(
    'Cursor latency for $name',
    async ({ name, cursor, description }) => {
      const latencies = await measureLatency(cursor);
      const stats = calculateStats(latencies);

      report.addResult({
        name,
        samples: latencies,
        description,
        ...stats,
      });
    },
  );

  test('Rapid cursor movements', async () => {
    const movements = 100;
    const timings: number[] = [];

    await Promise.all(
      Array(movements)
        .fill(null)
        .map((_, i) => {
          const cursor: Cursor = [i + 1, i + 1];
          return new Promise<void>((resolve) => {
            const startTime = performance.now();
            receiverSocket.once(CodeServiceMsg.UPDATE_CURSOR, () => {
              timings.push(performance.now() - startTime);
              resolve();
            });
            senderSocket.emit(CodeServiceMsg.UPDATE_CURSOR, cursor);
          });
        }),
    );

    const stats = calculateStats(timings);
    report.setRapidMovementResult({
      name: 'Rapid Cursor Movements',
      samples: timings,
      description: `${movements} rapid sequential cursor position updates`,
      ...stats,
    });
  });
});
