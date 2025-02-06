/**
 * Tests for measuring terminal output synchronization latency.
 * Tests different types of outputs and execution results.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

import { io as Client } from 'socket.io-client';

import { CodeServiceMsg, RoomServiceMsg } from '@codex/types/message';
import {
  ExecutionResultType,
  type ExecutionResult,
} from '@codex/types/terminal';

const SERVER_URL = process.env.SERVER_URL;
const SAMPLES_PER_TEST = 50;

const testCases: Array<{
  name: string;
  output: ExecutionResult;
  description: string;
}> = [
  {
    name: 'Small info message',
    output: {
      language: 'python',
      version: '3.9',
      run: {
        stdout: 'Hello, World!',
        stderr: '',
        code: 0,
        signal: null,
        output: 'Hello, World!',
      },
      type: ExecutionResultType.INFO,
    },
    description: 'Small informational message output',
  },
  {
    name: 'Program output with error',
    output: {
      language: 'python',
      version: '3.9',
      run: {
        stdout: '',
        stderr: 'NameError: name x is not defined\n  File "<stdin>", line 1',
        code: 1,
        signal: null,
        output: 'NameError: name x is not defined\n  File "<stdin>", line 1',
      },
      type: ExecutionResultType.ERROR,
    },
    description: 'Error message with stack trace',
  },
  {
    name: 'Large program output',
    output: {
      language: 'python',
      version: '3.9',
      run: {
        stdout: 'x'.repeat(10000),
        stderr: '',
        code: 0,
        signal: null,
        output: 'x'.repeat(10000),
      },
      type: ExecutionResultType.OUTPUT,
    },
    description: 'Large program output (10KB)',
  },
  {
    name: 'Mixed stdout and stderr',
    output: {
      language: 'python',
      version: '3.9',
      run: {
        stdout: 'Processing...\nDone!',
        stderr: 'Warning: deprecated feature used',
        code: 0,
        signal: null,
        output: 'Processing...\nDone!\nWarning: deprecated feature used',
      },
      type: ExecutionResultType.WARNING,
    },
    description: 'Output with both stdout and stderr content',
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
  outputSize: number;
  type: ExecutionResultType;
}

class TerminalLatencyReport {
  private results: TestResult[] = [];
  private streamingResults: TestResult | null = null;

  addResult(result: TestResult) {
    this.results.push(result);
  }

  setStreamingResult(result: TestResult) {
    this.streamingResults = result;
  }

  private formatNumber(num: number): string {
    return num.toFixed(2);
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  private generateTestCaseReport(result: TestResult): string {
    return `Test Case: ${result.name}
─────────────────────────────────────────────────────
Description: ${result.description}
Output Type: ${result.type}
Output Size: ${this.formatBytes(result.outputSize)}
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
    return `Terminal Output Synchronization Analysis Report
═══════════════════════════════════════════════════════════════
Timestamp: ${timestamp}
Server URL: ${SERVER_URL}
Number of Test Cases: ${this.results.length}
Samples per Test: ${SAMPLES_PER_TEST}

Individual Test Results
═══════════════════════════════════════════════════════════════
${this.results.map((r) => this.generateTestCaseReport(r)).join('\n')}

${this.streamingResults ? this.generateTestCaseReport(this.streamingResults) : ''}

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
    const filename = path.join(reportDir, `terminal-latency-${timestamp}.txt`);
    fs.writeFileSync(filename, this.generateReport());
    console.log(`Report saved to: ${filename}`);
  }
}

describe('Terminal Output Synchronization Tests', () => {
  let senderSocket: ReturnType<typeof Client>;
  let receiverSocket: ReturnType<typeof Client>;
  let roomId: string;
  const report = new TerminalLatencyReport();

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
  }, 160000);

  afterAll(() => {
    report.saveToFile();
    senderSocket?.disconnect();
    receiverSocket?.disconnect();
  });

  const measureLatency = async (output: ExecutionResult): Promise<number[]> => {
    const latencies: number[] = [];

    for (let i = 0; i < SAMPLES_PER_TEST; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Delay between samples

      const startTime = performance.now();
      await new Promise<void>((resolve) => {
        receiverSocket.once(CodeServiceMsg.UPDATE_TERM, () => {
          const latency = performance.now() - startTime;
          latencies.push(latency);
          resolve();
        });
        senderSocket.emit(CodeServiceMsg.UPDATE_TERM, output);
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
    'Terminal output latency for $name',
    async ({ name, output, description }) => {
      const latencies = await measureLatency(output);
      const stats = calculateStats(latencies);

      report.addResult({
        name,
        samples: latencies,
        description,
        outputSize: Buffer.from(output.run.output).length,
        type: output.type!,
        ...stats,
      });
    },
  );

  test('Streaming large output simulation', async () => {
    const chunks = 100;
    const chunkSize = 1000;
    const timings: number[] = [];
    let totalSize = 0;

    await Promise.all(
      Array(chunks)
        .fill(null)
        .map((_, i) => {
          const chunk: ExecutionResult = {
            language: 'python',
            version: '3.9',
            run: {
              stdout: `Chunk ${i + 1}: ${'x'.repeat(chunkSize)}`,
              stderr: '',
              code: 0,
              signal: null,
              output: `Chunk ${i + 1}: ${'x'.repeat(chunkSize)}`,
            },
            type: ExecutionResultType.OUTPUT,
          };

          totalSize += Buffer.from(chunk.run.output).length;

          return new Promise<void>((resolve) => {
            const startTime = performance.now();
            receiverSocket.once(CodeServiceMsg.UPDATE_TERM, () => {
              timings.push(performance.now() - startTime);
              resolve();
            });
            senderSocket.emit(CodeServiceMsg.UPDATE_TERM, chunk);
          });
        }),
    );

    const stats = calculateStats(timings);
    report.setStreamingResult({
      name: 'Streaming Large Output',
      samples: timings,
      description: `${chunks} chunks of ${chunkSize} bytes each, streamed sequentially`,
      outputSize: totalSize,
      type: ExecutionResultType.OUTPUT,
      ...stats,
    });
  });
});
