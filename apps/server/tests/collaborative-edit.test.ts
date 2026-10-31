/**
 * WebSocket latency analysis for collaborative editing
 * Enhanced reporting for academic evaluation
 */

import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { ROOM_DOC } from "@codex/types/realtime";
import * as Y from "yjs";

import {
  calculateStats,
  connectPeer,
  createRoomPeer,
  SERVER_URL,
  settle,
  type TestPeer,
} from "./helpers";

const SAMPLES_PER_TEST = 50;

interface Edit {
  // The document containing `initialCode`, which the edit builds on
  setup: Uint8Array;
  // The payload a real client would put on the wire for the edit
  update: Uint8Array;
}

const buildEdit = (
  initialCode: string,
  mutate: (text: Y.Text) => void
): Edit => {
  const doc = new Y.Doc();
  const text = doc.getText(ROOM_DOC.code);
  text.insert(0, initialCode);
  const setup = Y.encodeStateAsUpdate(doc);

  const before = Y.encodeStateVector(doc);
  doc.transact(() => mutate(text));
  return { setup, update: Y.encodeStateAsUpdate(doc, before) };
};

const testCases: TestCase[] = [
  {
    initialCode: "world",
    mutate: (text) => text.insert(0, "hello "),
    name: "Simple insertion at start",
  },
  {
    initialCode: "The quick brown fox",
    mutate: (text) => {
      text.delete(4, 5);
      text.insert(4, "lazy");
    },
    name: "Replace word in middle",
  },
  {
    initialCode: "First line",
    mutate: (text) => text.insert(10, "\nSecond line"),
    name: "Add new line",
  },
  {
    initialCode: "First\n\n\nLast",
    mutate: (text) => text.delete(6, 2),
    name: "Delete empty lines",
  },
  {
    initialCode: "Line 1",
    mutate: (text) => text.insert(6, "\n\nLine 3"),
    name: "Append after a trailing newline",
  },
  {
    initialCode: "Start\nEnd",
    mutate: (text) => text.insert(6, "Middle\nLine"),
    name: "Multi-line insertion",
  },
  {
    initialCode: "Hello beautiful world",
    mutate: (text) => text.delete(5, 10),
    name: "Delete partial line",
  },
  {
    initialCode: "x".repeat(1000),
    mutate: (text) => text.insert(499, "test"),
    name: "Handle very long line",
  },
  {
    initialCode: "Start",
    mutate: (text) => text.insert(5, "\n\n\n\n"),
    name: "Multiple consecutive newlines",
  },
];

interface TestResult {
  average: number;
  maximum: number;
  minimum: number;
  name: string;
  operationSize: number;
  samples: number[];
  standardDeviation: number;
}

interface TestCase {
  initialCode: string;
  mutate: (text: Y.Text) => void;
  name: string;
}

const formatNumber = (num: number): string => num.toFixed(2);

const generateTestCaseReport = (
  result: TestResult
): string => `Test Case: ${result.name}
─────────────────────────────────────────────────────
Update Size: ${result.operationSize} bytes
Samples: ${result.samples.map((s) => formatNumber(s)).join(", ")} ms

Statistics:
• Average Latency:      ${formatNumber(result.average)} ms
• Standard Deviation:   ${formatNumber(result.standardDeviation)} ms
• Minimum Latency:      ${formatNumber(result.minimum)} ms
• Maximum Latency:      ${formatNumber(result.maximum)} ms
`;

class LatencyReport {
  private readonly results: TestResult[] = [];
  private rapidEditResults: TestResult | null = null;

  addResult(result: TestResult) {
    this.results.push(result);
  }

  setRapidEditResult(result: TestResult) {
    this.rapidEditResults = result;
  }

  private generateRapidEditsReport(): string {
    if (!this.rapidEditResults) {
      return "";
    }
    return `Rapid Edits Test Results
═════════════════════════════════════════════════════
Number of Operations: 100
Operation Interval: Concurrent

Statistics:
• Average Latency:      ${formatNumber(this.rapidEditResults.average)} ms
• Standard Deviation:   ${formatNumber(this.rapidEditResults.standardDeviation)} ms
• Minimum Latency:      ${formatNumber(this.rapidEditResults.minimum)} ms
• Maximum Latency:      ${formatNumber(this.rapidEditResults.maximum)} ms
`;
  }

  generateReport(): string {
    const timestamp = new Date().toISOString();
    const summary = `Yjs CRDT Update Latency Analysis Report
═══════════════════════════════════════════════════════════════
Timestamp: ${timestamp}
Server URL: ${SERVER_URL}
Number of Test Cases: ${this.results.length}
Samples per Test: ${SAMPLES_PER_TEST}

Individual Test Results
═══════════════════════════════════════════════════════════════
${this.results.map((r) => generateTestCaseReport(r)).join("\n")}

${this.generateRapidEditsReport()}

Summary Statistics
═══════════════════════════════════════════════════════════════
Overall Average Latency: ${formatNumber(
      this.results.reduce((acc, r) => acc + r.average, 0) / this.results.length
    )} ms
Best Performance: ${formatNumber(Math.min(...this.results.map((r) => r.minimum)))} ms
Worst Performance: ${formatNumber(Math.max(...this.results.map((r) => r.maximum)))} ms
`;

    return summary;
  }

  saveToFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/gu, "-");
    const reportDir = path.join(process.cwd(), "test-results");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir);
    }
    const filename = path.join(reportDir, `edit-latency-${timestamp}.txt`);
    fs.writeFileSync(filename, this.generateReport());
    console.log(`Report saved to: ${filename}`);
  }
}

describe("WebSocket Latency Tests", () => {
  let sender: TestPeer;
  let receiver: TestPeer;
  const report = new LatencyReport();

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

  // Applies an update to the sender and times its arrival at the receiver
  const sendUpdate = async (update: Uint8Array): Promise<number> => {
    const received = receiver.nextDocUpdate();
    const startTime = performance.now();
    Y.applyUpdate(sender.doc, update);
    await received;
    return performance.now() - startTime;
  };

  // Each sample needs a fresh edit: Yjs ignores one it has already applied,
  // and holds back one whose base text it hasn't seen
  const measureLatency = async (
    initialCode: string,
    mutate: (text: Y.Text) => void
  ): Promise<number[]> => {
    const latencies: number[] = [];

    for (let i = 0; i < SAMPLES_PER_TEST; i += 1) {
      // biome-ignore lint/performance/noAwaitInLoops: samples are spaced out so each latency is measured alone
      await settle(100); // Delay between samples
      const { setup, update } = buildEdit(initialCode, mutate);
      await sendUpdate(setup);
      latencies.push(await sendUpdate(update));
    }

    return latencies;
  };

  it.each(testCases)(
    "WebSocket latency for $name",
    async ({ name, initialCode, mutate }) => {
      const latencies = await measureLatency(initialCode, mutate);
      const stats = calculateStats(latencies);

      report.addResult({
        name,
        samples: latencies,
        ...stats,
        operationSize: buildEdit(initialCode, mutate).update.byteLength,
      });
    }
  );

  it("WebSocket latency for rapid edits", async () => {
    const RAPID_EDIT_COUNT = 100;
    // Inserts into an empty document, so no setup is needed
    const edits = Array.from(
      { length: RAPID_EDIT_COUNT },
      (_, i) => buildEdit("", (text) => text.insert(0, `${i}`)).update
    );

    const timings = await Promise.all(edits.map(sendUpdate));

    expect(timings).toHaveLength(RAPID_EDIT_COUNT);

    const stats = calculateStats(timings);
    report.setRapidEditResult({
      name: "Rapid Edits",
      samples: timings,
      ...stats,
      operationSize: edits[0]?.byteLength ?? 0,
    });
  });
});
