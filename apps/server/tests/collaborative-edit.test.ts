/**
 * Socket.IO Latency Analysis for Collaborative Editing
 * Enhanced reporting for academic evaluation
 */

import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { CodeServiceMsg, RoomServiceMsg } from "@codex/types/message";
import { io as Client } from "socket.io-client";
import * as Y from "yjs";

const SERVER_URL = process.env.SERVER_URL;
const SAMPLES_PER_TEST = 50;

/** Must match CODE_TEXT_KEY on the client and server. */
const CODE_TEXT_KEY = "monaco";

/**
 * Build the binary update produced by applying `mutate` to a document that
 * already contains `initialCode`. This is the payload a real client would put
 * on the wire for that edit.
 */
const buildUpdate = (
  initialCode: string,
  mutate: (text: Y.Text) => void
): Uint8Array => {
  const doc = new Y.Doc();
  const text = doc.getText(CODE_TEXT_KEY);
  text.insert(0, initialCode);

  const before = Y.encodeStateVector(doc);
  doc.transact(() => mutate(text));
  return Y.encodeStateAsUpdate(doc, before);
};

const testCases: TestCase[] = [
  {
    name: "Simple insertion at start",
    initialCode: "world",
    mutate: (text) => text.insert(0, "hello "),
  },
  {
    name: "Replace word in middle",
    initialCode: "The quick brown fox",
    mutate: (text) => {
      text.delete(4, 5);
      text.insert(4, "lazy");
    },
  },
  {
    name: "Add new line",
    initialCode: "First line",
    mutate: (text) => text.insert(10, "\nSecond line"),
  },
  {
    name: "Delete empty lines",
    initialCode: "First\n\n\nLast",
    mutate: (text) => text.delete(6, 2),
  },
  {
    name: "Append after a trailing newline",
    initialCode: "Line 1",
    mutate: (text) => text.insert(6, "\n\nLine 3"),
  },
  {
    name: "Multi-line insertion",
    initialCode: "Start\nEnd",
    mutate: (text) => text.insert(6, "Middle\nLine"),
  },
  {
    name: "Delete partial line",
    initialCode: "Hello beautiful world",
    mutate: (text) => text.delete(5, 10),
  },
  {
    name: "Handle very long line",
    initialCode: "x".repeat(1000),
    mutate: (text) => text.insert(499, "test"),
  },
  {
    name: "Multiple consecutive newlines",
    initialCode: "Start",
    mutate: (text) => text.insert(5, "\n\n\n\n"),
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

class LatencyReport {
  private readonly results: TestResult[] = [];
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
Update Size: ${result.operationSize} bytes
Samples: ${result.samples.map((s) => this.formatNumber(s)).join(", ")} ms

Statistics:
• Average Latency:      ${this.formatNumber(result.average)} ms
• Standard Deviation:   ${this.formatNumber(result.standardDeviation)} ms
• Minimum Latency:      ${this.formatNumber(result.minimum)} ms
• Maximum Latency:      ${this.formatNumber(result.maximum)} ms
`;
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
• Average Latency:      ${this.formatNumber(this.rapidEditResults.average)} ms
• Standard Deviation:   ${this.formatNumber(this.rapidEditResults.standardDeviation)} ms
• Minimum Latency:      ${this.formatNumber(this.rapidEditResults.minimum)} ms
• Maximum Latency:      ${this.formatNumber(this.rapidEditResults.maximum)} ms
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
${this.results.map((r) => this.generateTestCaseReport(r)).join("\n")}

${this.generateRapidEditsReport()}

Summary Statistics
═══════════════════════════════════════════════════════════════
Overall Average Latency: ${this.formatNumber(
      this.results.reduce((acc, r) => acc + r.average, 0) / this.results.length
    )} ms
Best Performance: ${this.formatNumber(Math.min(...this.results.map((r) => r.minimum)))} ms
Worst Performance: ${this.formatNumber(Math.max(...this.results.map((r) => r.maximum)))} ms
`;

    return summary;
  }

  saveToFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportDir = path.join(process.cwd(), "test-results");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir);
    }
    const filename = path.join(reportDir, `edit-latency-${timestamp}.txt`);
    fs.writeFileSync(filename, this.generateReport());
    console.log(`Report saved to: ${filename}`);
  }
}

describe("Socket.IO Latency Tests", () => {
  let senderSocket: ReturnType<typeof Client>;
  let receiverSocket: ReturnType<typeof Client>;
  let roomId: string;
  const report = new LatencyReport();

  const createSocket = () => Client(SERVER_URL);

  beforeAll(async () => {
    // Create sender socket and room
    senderSocket = createSocket();
    await new Promise<void>((resolve, reject) => {
      senderSocket.on("connect_error", (error) => reject(error));
      senderSocket.on("connect", () => {
        resolve();
      });
    });

    // Create room
    await new Promise<void>((resolve) => {
      senderSocket.once(RoomServiceMsg.CREATE, (receivedRoomId: string) => {
        roomId = receivedRoomId;
        resolve();
      });
      senderSocket.emit(RoomServiceMsg.CREATE, "Sender");
    });

    // Setup receiver
    receiverSocket = createSocket();
    await new Promise<void>((resolve, reject) => {
      receiverSocket.on("connect_error", (error) => reject(error));
      receiverSocket.on("connect", () => {
        resolve();
      });
    });

    // Join room
    await new Promise<void>((resolve) => {
      receiverSocket.once(RoomServiceMsg.JOIN, () => {
        resolve();
      });
      receiverSocket.emit(RoomServiceMsg.JOIN, roomId, "Receiver");
    });

    // Warmup connection
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1000);
    });
  }, 130_000);

  afterAll(() => {
    report.saveToFile();
    senderSocket?.disconnect();
    receiverSocket?.disconnect();
  });

  const measureLatency = async (update: Uint8Array): Promise<number[]> => {
    const latencies: number[] = [];

    for (let i = 0; i < SAMPLES_PER_TEST; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Delay between samples

      const startTime = performance.now();
      await new Promise<void>((resolve) => {
        receiverSocket.once(CodeServiceMsg.UPDATE_CODE, () => {
          const latency = performance.now() - startTime;
          latencies.push(latency);
          resolve();
        });
        senderSocket.emit(CodeServiceMsg.UPDATE_CODE, update);
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
      samples.reduce((acc, val) => acc + (val - average) ** 2, 0) /
        samples.length
    );
    return {
      average,
      standardDeviation,
      minimum: Math.min(...samples),
      maximum: Math.max(...samples),
    };
  };

  test.each(testCases)("Socket.IO latency for $name", async ({
    name,
    initialCode,
    mutate,
  }) => {
    const update = buildUpdate(initialCode, mutate);
    const latencies = await measureLatency(update);
    const stats = calculateStats(latencies);

    report.addResult({
      name,
      samples: latencies,
      ...stats,
      operationSize: update.byteLength,
    });
  });

  test("Socket.IO latency for rapid edits", async () => {
    const RAPID_EDIT_COUNT = 100;
    const edits = Array.from({ length: RAPID_EDIT_COUNT }, (_, i) =>
      buildUpdate("", (text) => text.insert(0, `${i}`))
    );
    const timings: number[] = [];

    await Promise.all(
      edits.map(
        (edit) =>
          new Promise<void>((resolve) => {
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
      name: "Rapid Edits",
      samples: timings,
      ...stats,
      operationSize: edits[0]?.byteLength ?? 0,
    });
  });
});
