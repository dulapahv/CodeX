/**
 * Tests for measuring pointer tracking latency in collaborative editing.
 * Measures synchronization speed of pointer movements between users.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import type { Pointer } from "@codex/types/pointer";

import {
  calculateStats,
  connectPeer,
  createRoomPeer,
  SERVER_URL,
  settle,
  type TestPeer,
} from "./helpers";

const SAMPLES_PER_TEST = 50;

const testCases = [
  {
    description: "Small diagonal pointer movement (10px)",
    end: [110, 110] as Pointer,
    name: "Small movement",
    start: [100, 100] as Pointer,
  },
  {
    description: "Medium horizontal movement (200px)",
    end: [300, 100] as Pointer,
    name: "Medium horizontal movement",
    start: [100, 100] as Pointer,
  },
  {
    description: "Medium vertical movement (200px)",
    end: [100, 300] as Pointer,
    name: "Medium vertical movement",
    start: [100, 100] as Pointer,
  },
  {
    description: "Large diagonal movement (~565px)",
    end: [500, 500] as Pointer,
    name: "Large diagonal movement",
    start: [100, 100] as Pointer,
  },
  {
    description: "Movement across typical screen dimensions",
    end: [1920, 1080] as Pointer,
    name: "Screen corner movement",
    start: [0, 0] as Pointer,
  },
];

interface TestResult {
  average: number;
  description: string;
  maximum: number;
  minimum: number;
  movement?: {
    distance: number;
    speed?: number;
  };
  name: string;
  samples: number[];
  standardDeviation: number;
}

const formatNumber = (num: number): string => num.toFixed(2);

const generateTestCaseReport = (
  result: TestResult
): string => `Test Case: ${result.name}
─────────────────────────────────────────────────────
Description: ${result.description}
${
  result.movement
    ? `Movement Distance: ${formatNumber(result.movement.distance)} pixels
${result.movement.speed ? `Movement Speed: ${formatNumber(result.movement.speed)} pixels/sec` : ""}
`
    : ""
}
Samples: ${result.samples.map((s) => formatNumber(s)).join(", ")} ms

Statistics:
• Average Latency:      ${formatNumber(result.average)} ms
• Standard Deviation:   ${formatNumber(result.standardDeviation)} ms
• Minimum Latency:      ${formatNumber(result.minimum)} ms
• Maximum Latency:      ${formatNumber(result.maximum)} ms
`;

class PointerLatencyReport {
  private readonly results: TestResult[] = [];
  private rapidMovementResults: TestResult | null = null;

  addResult(result: TestResult) {
    this.results.push(result);
  }

  setRapidMovementResult(result: TestResult) {
    this.rapidMovementResults = result;
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
${this.results.map((r) => generateTestCaseReport(r)).join("\n")}

${this.rapidMovementResults ? generateTestCaseReport(this.rapidMovementResults) : ""}

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
    const filename = path.join(reportDir, `pointer-latency-${timestamp}.txt`);
    fs.writeFileSync(filename, this.generateReport());
    console.log(`Report saved to: ${filename}`);
  }
}

describe("Pointer Tracking Latency Tests", () => {
  let sender: TestPeer;
  let receiver: TestPeer;
  const report = new PointerLatencyReport();

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

  const calculateDistance = (start: Pointer, end: Pointer): number => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Publishes a pointer and times its arrival in the receiver's presence
  const sendPointer = async (pointer: Pointer): Promise<number> => {
    const received = receiver.nextPresenceUpdate(sender.clientId);
    const startTime = performance.now();
    sender.setPresence({ pointer });
    await received;
    return performance.now() - startTime;
  };

  const measureLatency = async (
    start: Pointer,
    end: Pointer
  ): Promise<number[]> => {
    const latencies: number[] = [];

    for (let i = 0; i < SAMPLES_PER_TEST; i += 1) {
      // biome-ignore lint/performance/noAwaitInLoops: samples are spaced out so each latency is measured alone
      await settle(100); // Delay between samples

      // First movement to start position, then measure the move to the end
      await sendPointer(start);
      latencies.push(await sendPointer(end));
    }

    return latencies;
  };

  it.each(testCases)(
    "Pointer latency for $name",
    async ({ name, start, end, description }) => {
      const latencies = await measureLatency(start, end);
      const stats = calculateStats(latencies);
      const distance = calculateDistance(start, end);

      report.addResult({
        description,
        movement: {
          distance,
          speed: distance / (stats.average / 1000), // pixels per second
        },
        name,
        samples: latencies,
        ...stats,
      });
    }
  );

  it("Rapid pointer movements", async () => {
    const movements = 100;
    let totalDistance = 0;
    let lastPosition: Pointer = [0, 0];

    const positions = Array.from({ length: movements }, (_, i) => {
      const newPosition: Pointer = [
        100 * Math.cos((i * Math.PI) / 10) + 500,
        100 * Math.sin((i * Math.PI) / 10) + 500,
      ];
      totalDistance += calculateDistance(lastPosition, newPosition);
      lastPosition = newPosition;
      return newPosition;
    });

    const timings = await Promise.all(positions.map(sendPointer));

    expect(timings).toHaveLength(movements);

    const stats = calculateStats(timings);
    report.setRapidMovementResult({
      description: `${movements} rapid circular pointer movements`,
      movement: {
        distance: totalDistance,
        speed: totalDistance / ((stats.average * movements) / 1000),
      },
      name: "Rapid Pointer Movements",
      samples: timings,
      ...stats,
    });
  });
});
