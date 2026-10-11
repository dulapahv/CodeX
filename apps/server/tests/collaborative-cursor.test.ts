/**
 * Tests for measuring cursor synchronization latency in collaborative editing.
 * Tests both simple cursor movements and selection operations.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import type { Cursor } from "@codex/types/operation";

import {
  calculateStats,
  connectPeer,
  createRoomPeer,
  SERVER_URL,
  settle,
  type TestPeer,
} from "./helpers";

const SAMPLES_PER_TEST = 50;
// Awareness only sends changed state, so each sample starts from here
const RESET_CURSOR: Cursor = [0, 0];

const testCases = [
  {
    name: "Simple cursor movement",
    cursor: [1, 1] as Cursor,
    description: "Basic cursor position update at start of document",
  },
  {
    name: "Long-distance cursor jump",
    cursor: [100, 50] as Cursor,
    description: "Cursor movement to a distant position",
  },
  {
    name: "Simple text selection",
    cursor: [1, 1, 1, 1, 1, 10] as Cursor,
    description: "Selection within a single line",
  },
  {
    name: "Multi-line selection",
    cursor: [1, 1, 1, 1, 5, 10] as Cursor,
    description: "Selection spanning multiple lines",
  },
  {
    name: "Large text selection",
    cursor: [1, 1, 1, 1, 100, 100] as Cursor,
    description: "Selection of a large portion of text",
  },
];

interface TestResult {
  average: number;
  description: string;
  maximum: number;
  minimum: number;
  name: string;
  samples: number[];
  standardDeviation: number;
}

class CursorLatencyReport {
  private readonly results: TestResult[] = [];
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
    return `Cursor Synchronization Latency Analysis Report
═══════════════════════════════════════════════════════════════
Timestamp: ${timestamp}
Server URL: ${SERVER_URL}
Number of Test Cases: ${this.results.length}
Samples per Test: ${SAMPLES_PER_TEST}

Individual Test Results
═══════════════════════════════════════════════════════════════
${this.results.map((r) => this.generateTestCaseReport(r)).join("\n")}

${this.rapidMovementResults ? this.generateTestCaseReport(this.rapidMovementResults) : ""}

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
    const filename = path.join(reportDir, `cursor-latency-${timestamp}.txt`);
    fs.writeFileSync(filename, this.generateReport());
    console.log(`Report saved to: ${filename}`);
  }
}

describe("Cursor Synchronization Latency Tests", () => {
  let sender: TestPeer;
  let receiver: TestPeer;
  const report = new CursorLatencyReport();

  beforeAll(async () => {
    const [peer, roomId] = await createRoomPeer("Sender");
    sender = peer;
    receiver = await connectPeer(roomId, "Receiver");

    // Warmup connection
    await settle(1000);
  }, 130_000);

  afterAll(() => {
    report.saveToFile();
    sender?.leave();
    receiver?.leave();
  });

  // Publishes a cursor and times its arrival in the receiver's presence
  const sendCursor = async (cursor: Cursor): Promise<number> => {
    const received = receiver.nextPresenceUpdate(sender.clientId);
    const startTime = performance.now();
    sender.setPresence({ cursor });
    await received;
    return performance.now() - startTime;
  };

  const measureLatency = async (cursor: Cursor): Promise<number[]> => {
    const latencies: number[] = [];

    for (let i = 0; i < SAMPLES_PER_TEST; i++) {
      await settle(100); // Delay between samples
      await sendCursor(RESET_CURSOR);
      latencies.push(await sendCursor(cursor));
    }

    return latencies;
  };

  test.each(testCases)("Cursor latency for $name", async ({
    name,
    cursor,
    description,
  }) => {
    const latencies = await measureLatency(cursor);
    const stats = calculateStats(latencies);

    report.addResult({
      name,
      samples: latencies,
      description,
      ...stats,
    });
  });

  test("Rapid cursor movements", async () => {
    const movements = 100;

    const timings = await Promise.all(
      Array.from({ length: movements }, (_, i) =>
        sendCursor([i + 1, i + 1] as Cursor)
      )
    );

    const stats = calculateStats(timings);
    report.setRapidMovementResult({
      name: "Rapid Cursor Movements",
      samples: timings,
      description: `${movements} rapid sequential cursor position updates`,
      ...stats,
    });
  });
});
