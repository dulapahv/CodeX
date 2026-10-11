/**
 * Tests for measuring terminal output synchronization latency.
 * Tests different types of outputs and execution results.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import {
  type ExecutionResult,
  ExecutionResultType,
} from "@codex/types/terminal";

import {
  calculateStats,
  connectPeer,
  createRoomPeer,
  SERVER_URL,
  settle,
  type TestPeer,
} from "./helpers";

const SAMPLES_PER_TEST = 50;

const testCases: Array<{
  name: string;
  output: ExecutionResult;
  description: string;
}> = [
  {
    name: "Small info message",
    output: {
      language: "python",
      version: "3.9",
      run: {
        stdout: "Hello, World!",
        stderr: "",
        code: 0,
        signal: null,
        output: "Hello, World!",
      },
      type: ExecutionResultType.INFO,
    },
    description: "Small informational message output",
  },
  {
    name: "Program output with error",
    output: {
      language: "python",
      version: "3.9",
      run: {
        stdout: "",
        stderr: 'NameError: name x is not defined\n  File "<stdin>", line 1',
        code: 1,
        signal: null,
        output: 'NameError: name x is not defined\n  File "<stdin>", line 1',
      },
      type: ExecutionResultType.ERROR,
    },
    description: "Error message with stack trace",
  },
  {
    name: "Large program output",
    output: {
      language: "python",
      version: "3.9",
      run: {
        stdout: "x".repeat(10_000),
        stderr: "",
        code: 0,
        signal: null,
        output: "x".repeat(10_000),
      },
      type: ExecutionResultType.OUTPUT,
    },
    description: "Large program output (10KB)",
  },
  {
    name: "Mixed stdout and stderr",
    output: {
      language: "python",
      version: "3.9",
      run: {
        stdout: "Processing...\nDone!",
        stderr: "Warning: deprecated feature used",
        code: 0,
        signal: null,
        output: "Processing...\nDone!\nWarning: deprecated feature used",
      },
      type: ExecutionResultType.WARNING,
    },
    description: "Output with both stdout and stderr content",
  },
];

interface TestResult {
  average: number;
  description: string;
  maximum: number;
  minimum: number;
  name: string;
  outputSize: number;
  samples: number[];
  standardDeviation: number;
  type: ExecutionResultType;
}

class TerminalLatencyReport {
  private readonly results: TestResult[] = [];
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
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  private generateTestCaseReport(result: TestResult): string {
    return `Test Case: ${result.name}
─────────────────────────────────────────────────────
Description: ${result.description}
Output Type: ${result.type}
Output Size: ${this.formatBytes(result.outputSize)}
Samples: ${result.samples.map((s) => this.formatNumber(s)).join(", ")} ms

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
${this.results.map((r) => this.generateTestCaseReport(r)).join("\n")}

${this.streamingResults ? this.generateTestCaseReport(this.streamingResults) : ""}

Summary Statistics
═══════════════════════════════════════════════════════════════
Overall Average Latency: ${this.formatNumber(
      this.results.reduce((acc, r) => acc + r.average, 0) / this.results.length
    )} ms
Best Performance: ${this.formatNumber(Math.min(...this.results.map((r) => r.minimum)))} ms
Worst Performance: ${this.formatNumber(Math.max(...this.results.map((r) => r.maximum)))} ms
`;
  }

  saveToFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportDir = path.join(process.cwd(), "test-results");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir);
    }
    const filename = path.join(reportDir, `terminal-latency-${timestamp}.txt`);
    fs.writeFileSync(filename, this.generateReport());
    console.log(`Report saved to: ${filename}`);
  }
}

describe("Terminal Output Synchronization Tests", () => {
  let sender: TestPeer;
  let receiver: TestPeer;
  const report = new TerminalLatencyReport();

  beforeAll(async () => {
    const [peer, roomId] = await createRoomPeer("Sender");
    sender = peer;
    receiver = await connectPeer(roomId, "Receiver");

    // Warmup connection
    await settle(1000);
  }, 160_000);

  afterAll(() => {
    report.saveToFile();
    sender?.leave();
    receiver?.leave();
  });

  // Sends a result and times its arrival at the receiver
  const sendOutput = async (output: ExecutionResult): Promise<number> => {
    const received = receiver.nextMessage("terminal");
    const startTime = performance.now();
    sender.send({ type: "terminal", result: output });
    await received;
    return performance.now() - startTime;
  };

  const measureLatency = async (output: ExecutionResult): Promise<number[]> => {
    const latencies: number[] = [];

    for (let i = 0; i < SAMPLES_PER_TEST; i++) {
      await settle(100); // Delay between samples
      latencies.push(await sendOutput(output));
    }

    return latencies;
  };

  test.each(testCases)("Terminal output latency for $name", async ({
    name,
    output,
    description,
  }) => {
    const latencies = await measureLatency(output);
    const stats = calculateStats(latencies);

    report.addResult({
      name,
      samples: latencies,
      description,
      outputSize: Buffer.from(output.run.output).length,
      type: output.type ?? ExecutionResultType.OUTPUT,
      ...stats,
    });
  });

  test("Streaming large output simulation", async () => {
    const chunks = 100;
    const chunkSize = 1000;
    let totalSize = 0;

    const outputs = Array.from({ length: chunks }, (_, i): ExecutionResult => {
      const text = `Chunk ${i + 1}: ${"x".repeat(chunkSize)}`;
      totalSize += Buffer.from(text).length;
      return {
        language: "python",
        version: "3.9",
        run: { stdout: text, stderr: "", code: 0, signal: null, output: text },
        type: ExecutionResultType.OUTPUT,
      };
    });

    const timings = await Promise.all(outputs.map(sendOutput));

    const stats = calculateStats(timings);
    report.setStreamingResult({
      name: "Streaming Large Output",
      samples: timings,
      description: `${chunks} chunks of ${chunkSize} bytes each, streamed sequentially`,
      outputSize: totalSize,
      type: ExecutionResultType.OUTPUT,
      ...stats,
    });
  });
});
