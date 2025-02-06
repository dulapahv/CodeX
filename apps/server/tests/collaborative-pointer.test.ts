/**
 * Tests for measuring pointer tracking latency in collaborative editing.
 * Measures synchronization speed of pointer movements between users.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

import { io as Client } from 'socket.io-client';

import { PointerServiceMsg, RoomServiceMsg } from '@codex/types/message';
import type { Pointer } from '@codex/types/pointer';

const SERVER_URL = process.env.SERVER_URL;
const SAMPLES_PER_TEST = 50;

const testCases = [
  {
    name: 'Small movement',
    start: [100, 100] as Pointer,
    end: [110, 110] as Pointer,
    description: 'Small diagonal pointer movement (10px)',
  },
  {
    name: 'Medium horizontal movement',
    start: [100, 100] as Pointer,
    end: [300, 100] as Pointer,
    description: 'Medium horizontal movement (200px)',
  },
  {
    name: 'Medium vertical movement',
    start: [100, 100] as Pointer,
    end: [100, 300] as Pointer,
    description: 'Medium vertical movement (200px)',
  },
  {
    name: 'Large diagonal movement',
    start: [100, 100] as Pointer,
    end: [500, 500] as Pointer,
    description: 'Large diagonal movement (~565px)',
  },
  {
    name: 'Screen corner movement',
    start: [0, 0] as Pointer,
    end: [1920, 1080] as Pointer,
    description: 'Movement across typical screen dimensions',
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
  movement?: {
    distance: number;
    speed?: number;
  };
}

class PointerLatencyReport {
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
${
  result.movement
    ? `Movement Distance: ${this.formatNumber(result.movement.distance)} pixels
${result.movement.speed ? `Movement Speed: ${this.formatNumber(result.movement.speed)} pixels/sec` : ''}
`
    : ''
}
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
    return `Pointer Tracking Latency Analysis Report
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
    const filename = path.join(reportDir, `pointer-latency-${timestamp}.txt`);
    fs.writeFileSync(filename, this.generateReport());
    console.log(`Report saved to: ${filename}`);
  }
}

describe('Pointer Tracking Latency Tests', () => {
  let senderSocket: ReturnType<typeof Client>;
  let receiverSocket: ReturnType<typeof Client>;
  let roomId: string;
  const report = new PointerLatencyReport();

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

  const calculateDistance = (start: Pointer, end: Pointer): number => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    return Math.sqrt(dx * dx + dy * dy);
  };

  const measureLatency = async (
    start: Pointer,
    end: Pointer,
  ): Promise<number[]> => {
    const latencies: number[] = [];

    for (let i = 0; i < SAMPLES_PER_TEST; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Delay between samples

      // First movement to start position
      await new Promise<void>((resolve) => {
        receiverSocket.once(PointerServiceMsg.POINTER, () => {
          resolve();
        });
        senderSocket.emit(PointerServiceMsg.POINTER, start);
      });

      // Measure movement to end position
      const startTime = performance.now();
      await new Promise<void>((resolve) => {
        receiverSocket.once(PointerServiceMsg.POINTER, () => {
          const latency = performance.now() - startTime;
          latencies.push(latency);
          resolve();
        });
        senderSocket.emit(PointerServiceMsg.POINTER, end);
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
    'Pointer latency for $name',
    async ({ name, start, end, description }) => {
      const latencies = await measureLatency(start, end);
      const stats = calculateStats(latencies);
      const distance = calculateDistance(start, end);

      report.addResult({
        name,
        samples: latencies,
        description,
        movement: {
          distance,
          speed: distance / (stats.average / 1000), // pixels per second
        },
        ...stats,
      });
    },
  );

  test('Rapid pointer movements', async () => {
    const movements = 100;
    const timings: number[] = [];
    let totalDistance = 0;
    let lastPosition: Pointer = [0, 0];

    await Promise.all(
      Array(movements)
        .fill(null)
        .map((_, i) => {
          const newPosition: Pointer = [
            100 * Math.cos((i * Math.PI) / 10) + 500,
            100 * Math.sin((i * Math.PI) / 10) + 500,
          ];
          totalDistance += calculateDistance(lastPosition, newPosition);
          lastPosition = newPosition;

          return new Promise<void>((resolve) => {
            const startTime = performance.now();
            receiverSocket.once(PointerServiceMsg.POINTER, () => {
              timings.push(performance.now() - startTime);
              resolve();
            });
            senderSocket.emit(PointerServiceMsg.POINTER, newPosition);
          });
        }),
    );

    const stats = calculateStats(timings);
    report.setRapidMovementResult({
      name: 'Rapid Pointer Movements',
      samples: timings,
      description: `${movements} rapid circular pointer movements`,
      movement: {
        distance: totalDistance,
        speed: totalDistance / ((stats.average * movements) / 1000),
      },
      ...stats,
    });
  });
});
