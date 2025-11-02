/**
 * Socket.IO Latency Analysis for Collaborative Editing
 * Enhanced reporting for academic evaluation
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

import { io as Client } from 'socket.io-client';

import { CodeServiceMsg, RoomServiceMsg } from '@codex/types/message';
import type { EditOp } from '@codex/types/operation';

const SERVER_URL = process.env.SERVER_URL;
const SAMPLES_PER_TEST = 50;

const testCases: TestCase[] = [
  {
    name: 'Simple insertion at start',
    initialCode: 'world',
    operation: ['hello ', 1, 1, 1, 1] as EditOp,
    expectedResult: 'hello world'
  },
  {
    name: 'Replace word in middle',
    initialCode: 'The quick brown fox',
    operation: ['lazy', 1, 5, 1, 10] as EditOp,
    expectedResult: 'The lazy brown fox'
  },
  {
    name: 'Add new line',
    initialCode: 'First line',
    operation: ['\nSecond line', 1, 11, 1, 11] as EditOp,
    expectedResult: 'First line\nSecond line'
  },
  {
    name: 'Delete empty lines',
    initialCode: 'First\n\n\nLast',
    operation: ['', 2, 1, 4, 1] as EditOp,
    expectedResult: 'First\nLast'
  },
  {
    name: 'Insert at non-existent line',
    initialCode: 'Line 1',
    operation: ['Line 3', 3, 1, 3, 1] as EditOp,
    expectedResult: 'Line 1\n\nLine 3'
  },
  {
    name: 'Multi-line insertion',
    initialCode: 'Start\nEnd',
    operation: ['Middle\nLine', 2, 1, 2, 1] as EditOp,
    expectedResult: 'Start\nMiddle\nLineEnd'
  },
  {
    name: 'Delete partial line',
    initialCode: 'Hello beautiful world',
    operation: ['', 1, 6, 1, 16] as EditOp,
    expectedResult: 'Hello world'
  },
  {
    name: 'Handle very long line',
    initialCode: 'x'.repeat(1000),
    operation: ['test', 1, 500, 1, 500] as EditOp,
    expectedResult: 'x'.repeat(499) + 'test' + 'x'.repeat(501)
  },
  {
    name: 'Multiple consecutive newlines',
    initialCode: 'Start',
    operation: ['\n\n\n\n', 1, 6, 1, 6] as EditOp,
    expectedResult: 'Start\n\n\n\n'
  }
];

interface TestResult {
  name: string;
  samples: number[];
  average: number;
  standardDeviation: number;
  minimum: number;
  maximum: number;
  operationSize: number;
}

type TestCase = {
  name: string;
  initialCode: string;
  operation: EditOp;
  expectedResult: string;
};

class LatencyReport {
  private results: TestResult[] = [];
  private rapidEditResults: TestResult | null = null;

  addResult(result: TestResult) {
    this.results.push(result);
  }

  setRapidEditResult(result: TestResult) {
    this.rapidEditResults = result;
  }

  private formatNumber(num: number): string {
    return num.toFixed(2);
  }

  private generateTestCaseReport(result: TestResult): string {
    return `Test Case: ${result.name}
─────────────────────────────────────────────────────
Operation Size: ${result.operationSize} bytes
Samples: ${result.samples.map(s => this.formatNumber(s)).join(', ')} ms

Statistics:
• Average Latency:      ${this.formatNumber(result.average)} ms
• Standard Deviation:   ${this.formatNumber(result.standardDeviation)} ms
• Minimum Latency:      ${this.formatNumber(result.minimum)} ms
• Maximum Latency:      ${this.formatNumber(result.maximum)} ms
`;
  }

  private generateRapidEditsReport(): string {
    if (!this.rapidEditResults) return '';
    return `Rapid Edits Test Results
═════════════════════════════════════════════════════
Number of Operations: 100
Operation Interval: Concurrent

Statistics:
• Average Latency:      ${this.formatNumber(this.rapidEditResults.average)} ms
• Standard Deviation:   ${this.formatNumber(this.rapidEditResults.standardDeviation)} ms
• Minimum Latency:      ${this.formatNumber(this.rapidEditResults.minimum)} ms
• Maximum Latency:      ${this.formatNumber(this.rapidEditResults.maximum)} ms
`;
  }

  generateReport(): string {
    const timestamp = new Date().toISOString();
    const summary = `Socket.IO Edit Operation Latency Analysis Report
═══════════════════════════════════════════════════════════════
Timestamp: ${timestamp}
Server URL: ${SERVER_URL}
Number of Test Cases: ${this.results.length}
Samples per Test: ${SAMPLES_PER_TEST}

Individual Test Results
═══════════════════════════════════════════════════════════════
${this.results.map(r => this.generateTestCaseReport(r)).join('\n')}

${this.generateRapidEditsReport()}

Summary Statistics
═══════════════════════════════════════════════════════════════
Overall Average Latency: ${this.formatNumber(
      this.results.reduce((acc, r) => acc + r.average, 0) / this.results.length
    )} ms
Best Performance: ${this.formatNumber(Math.min(...this.results.map(r => r.minimum)))} ms
Worst Performance: ${this.formatNumber(Math.max(...this.results.map(r => r.maximum)))} ms
`;

    return summary;
  }

  saveToFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir);
    }
    const filename = path.join(reportDir, `edit-latency-${timestamp}.txt`);
    fs.writeFileSync(filename, this.generateReport());
    console.log(`Report saved to: ${filename}`);
  }
}

describe('Socket.IO Latency Tests', () => {
  let senderSocket: ReturnType<typeof Client>;
  let receiverSocket: ReturnType<typeof Client>;
  let roomId: string;
  const report = new LatencyReport();

  const createSocket = () => Client(SERVER_URL);

  beforeAll(async () => {
    // Create sender socket and room
    senderSocket = createSocket();
    await new Promise<void>((resolve, reject) => {
      senderSocket.on('connect_error', error => reject(error));
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
      receiverSocket.on('connect_error', error => reject(error));
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
    await new Promise<void>(resolve => {
      setTimeout(resolve, 1000);
    });
  }, 130000);

  afterAll(() => {
    report.saveToFile();
    senderSocket?.disconnect();
    receiverSocket?.disconnect();
  });

  const measureLatency = async (operation: EditOp): Promise<number[]> => {
    const latencies: number[] = [];

    for (let i = 0; i < SAMPLES_PER_TEST; i++) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Delay between samples

      const startTime = performance.now();
      await new Promise<void>(resolve => {
        receiverSocket.once(CodeServiceMsg.UPDATE_CODE, () => {
          const latency = performance.now() - startTime;
          latencies.push(latency);
          resolve();
        });
        senderSocket.emit(CodeServiceMsg.UPDATE_CODE, operation);
      });
    }

    return latencies;
  };

  const calculateStats = (
    samples: number[]
  ): {
    average: number;
    standardDeviation: number;
    minimum: number;
    maximum: number;
  } => {
    const average = samples.reduce((a, b) => a + b) / samples.length;
    const standardDeviation = Math.sqrt(
      samples.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / samples.length
    );
    return {
      average,
      standardDeviation,
      minimum: Math.min(...samples),
      maximum: Math.max(...samples)
    };
  };

  test.each(testCases)('Socket.IO latency for $name', async ({ name, operation }) => {
    const latencies = await measureLatency(operation);
    const stats = calculateStats(latencies);

    report.addResult({
      name,
      samples: latencies,
      ...stats,
      operationSize: Buffer.from(String(operation[0])).length
    });
  });

  test('Socket.IO latency for rapid edits', async () => {
    const edits: EditOp[] = Array(100)
      .fill(null)
      .map((_, i) => [`${i}`, 1, 1, 1, 1] as EditOp);
    const timings: number[] = [];

    await Promise.all(
      edits.map(
        edit =>
          new Promise<void>(resolve => {
            const startTime = performance.now();
            receiverSocket.once(CodeServiceMsg.UPDATE_CODE, () => {
              timings.push(performance.now() - startTime);
              resolve();
            });
            senderSocket.emit(CodeServiceMsg.UPDATE_CODE, edit);
          })
      )
    );

    const stats = calculateStats(timings);
    report.setRapidEditResult({
      name: 'Rapid Edits',
      samples: timings,
      ...stats,
      operationSize: 1
    });
  });
});
