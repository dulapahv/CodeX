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
    description: "Small informational message output",
    name: "Small info message",
    output: {
      language: "python",
      run: {
        code: 0,
        output: "Hello, World!",
        signal: null,
        stderr: "",
        stdout: "Hello, World!",
      },
      type: ExecutionResultType.INFO,
      version: "3.9",
    },
  },
  {
    description: "Error message with stack trace",
    name: "Program output with error",
    output: {
      language: "python",
      run: {
        code: 1,
        output: 'NameError: name x is not defined\n  File "<stdin>", line 1',
        signal: null,
        stderr: 'NameError: name x is not defined\n  File "<stdin>", line 1',
        stdout: "",
      },
      type: ExecutionResultType.ERROR,
      version: "3.9",
    },
  },
  {
    description: "Large program output (10KB)",
    name: "Large program output",
    output: {
      language: "python",
      run: {
        code: 0,
        output: "x".repeat(10_000),
        signal: null,
        stderr: "",
        stdout: "x".repeat(10_000),
      },
      type: ExecutionResultType.OUTPUT,
      version: "3.9",
    },
  },
  {
    description: "Output with both stdout and stderr content",
    name: "Mixed stdout and stderr",
    output: {
      language: "python",
      run: {
        code: 0,
        output: "Processing...\nDone!\nWarning: deprecated feature used",
        signal: null,
        stderr: "Warning: deprecated feature used",
        stdout: "Processing...\nDone!",
      },
      type: ExecutionResultType.WARNING,
      version: "3.9",
    },
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

const formatNumber = (num: number): string => num.toFixed(2);

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const generateTestCaseReport = (
  result: TestResult
): string => `Test Case: ${result.name}
─────────────────────────────────────────────────────
Description: ${result.description}
Output Type: ${result.type}
Output Size: ${formatBytes(result.outputSize)}
Samples: ${result.samples.map((s) => formatNumber(s)).join(", ")} ms

Statistics:
• Average Latency:      ${formatNumber(result.average)} ms
• Standard Deviation:   ${formatNumber(result.standardDeviation)} ms
• Minimum Latency:      ${formatNumber(result.minimum)} ms
• Maximum Latency:      ${formatNumber(result.maximum)} ms
`;

class TerminalLatencyReport {
  private readonly results: TestResult[] = [];
  private streamingResults: TestResult | null = null;

  addResult(result: TestResult) {
    this.results.push(result);
  }

  setStreamingResult(result: TestResult) {
    this.streamingResults = result;
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
${this.results.map((r) => generateTestCaseReport(r)).join("\n")}

${this.streamingResults ? generateTestCaseReport(this.streamingResults) : ""}

Summary Statistics
═══════════════════════════════════════════════════════════════
Overall Average Latency: ${formatNumber(
      this.results.reduce((acc, r) => acc + r.average, 0) / this.results.length
    )} ms
Best Performance: ${formatNumber(Math.min(...this.results.map((r) => r.minimum)))} ms
Worst Performance: ${formatNumber(Math.max(...this.results.map((r) => r.maximum)))} ms
`;
  }

  saveToFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/gu, "-");
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
    sender.send({ result: output, type: "terminal" });
    await received;
    return performance.now() - startTime;
  };

  const measureLatency = async (output: ExecutionResult): Promise<number[]> => {
    const latencies: number[] = [];

    for (let i = 0; i < SAMPLES_PER_TEST; i += 1) {
      // biome-ignore lint/performance/noAwaitInLoops: samples are spaced out so each latency is measured alone
      await settle(100); // Delay between samples
      latencies.push(await sendOutput(output));
    }

    return latencies;
  };

  it.each(testCases)(
    "Terminal output latency for $name",
    async ({ name, output, description }) => {
      const latencies = await measureLatency(output);
      const stats = calculateStats(latencies);

      report.addResult({
        description,
        name,
        outputSize: Buffer.from(output.run.output).length,
        samples: latencies,
        type: output.type ?? ExecutionResultType.OUTPUT,
        ...stats,
      });
    }
  );

  it("Streaming large output simulation", async () => {
    const chunks = 100;
    const chunkSize = 1000;
    let totalSize = 0;

    const outputs = Array.from({ length: chunks }, (_, i): ExecutionResult => {
      const text = `Chunk ${i + 1}: ${"x".repeat(chunkSize)}`;
      totalSize += Buffer.from(text).length;
      return {
        language: "python",
        run: { code: 0, output: text, signal: null, stderr: "", stdout: text },
        type: ExecutionResultType.OUTPUT,
        version: "3.9",
      };
    });

    const timings = await Promise.all(outputs.map(sendOutput));

    expect(timings).toHaveLength(chunks);

    const stats = calculateStats(timings);
    report.setStreamingResult({
      description: `${chunks} chunks of ${chunkSize} bytes each, streamed sequentially`,
      name: "Streaming Large Output",
      outputSize: totalSize,
      samples: timings,
      type: ExecutionResultType.OUTPUT,
      ...stats,
    });
  });
});
