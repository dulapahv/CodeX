/**
 * Room lifecycle and relay rules of the realtime Worker.
 * Tests:
 * - Creating and looking up rooms
 * - Rejecting unknown rooms, invalid names and misrouted signals
 * - Terminal history for late joiners
 * - Terminating a room, and wiping it after the grace period
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { CloseCode, TERMINAL_HISTORY_LIMIT } from "@codex/types/realtime";
import type { ExecutionResult } from "@codex/types/terminal";

import {
  connectPeer,
  createRoomId,
  createRoomPeer,
  roomStatus,
  settle,
  type TestPeer,
} from "./helpers";

// test:socket runs the Worker with ROOM_GRACE_MS=10000
const GRACE_MS = 10_000;
const ROOM_ID_PATTERN = /^[A-Z0-9]{8}$/;

const result = (stdout: string): ExecutionResult => ({
  language: "python",
  version: "3.12",
  run: { stdout, stderr: "", code: 0, signal: null, output: stdout },
});

describe("Room lifecycle", () => {
  const peers: TestPeer[] = [];

  const track = (peer: TestPeer): TestPeer => {
    peers.push(peer);
    return peer;
  };

  afterEach(() => {
    for (const peer of peers) {
      peer.leave();
    }
    peers.length = 0;
  });

  test("creates a room that can be looked up with or without the dash", async () => {
    const roomId = await createRoomId();

    expect(roomId).toMatch(ROOM_ID_PATTERN);
    expect(await roomStatus(roomId)).toBe(200);
    expect(await roomStatus(`${roomId.slice(0, 4)}-${roomId.slice(4)}`)).toBe(
      200
    );
    expect(await roomStatus("ZZZZ-ZZZZ")).toBe(404);
  });

  test("closes connections to a room that doesn't exist", async () => {
    const peer = track(
      await connectPeer("ZZZZZZZZ", "Ghost", { waitForSync: false })
    );

    expect(await peer.waitForClose()).toBe(CloseCode.ROOM_NOT_FOUND);
  });

  test("ignores presence with an invalid name", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(await connectPeer(roomId, "Bob"));
    await settle();

    bob.setPresence({ user: { name: "" } });
    await settle();

    expect(alice.presenceOf(bob.clientId)?.user.name).toBe("Bob");
  });

  test("delivers a signal only to its target", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(await connectPeer(roomId, "Bob"));
    const carol = track(await connectPeer(roomId, "Carol"));
    await settle();

    alice.send({ type: "signal", to: bob.clientId, signal: { type: "offer" } });
    await settle();

    expect(bob.messages).toContainEqual({
      type: "signal",
      from: alice.clientId,
      signal: { type: "offer" },
    });
    expect(carol.messages.some((m) => m.type === "signal")).toBe(false);
  });

  test("gives a late joiner the room's recent terminal output", async () => {
    const [author, roomId] = await createRoomPeer("Author");
    track(author);
    const total = TERMINAL_HISTORY_LIMIT + 5;
    for (let i = 1; i <= total; i++) {
      author.send({ type: "terminal", result: result(`run ${i}`) });
    }
    await settle(2000);

    const latecomer = track(await connectPeer(roomId, "Latecomer"));
    await settle();

    const history = latecomer.messages.find(
      (m) => m.type === "terminal-history"
    );
    const outputs =
      history?.type === "terminal-history"
        ? history.results.map((r) => r.run.stdout)
        : [];
    expect(outputs).toHaveLength(TERMINAL_HISTORY_LIMIT);
    expect(outputs[0]).toBe("run 6");
    expect(outputs.at(-1)).toBe(`run ${total}`);
  });

  test("terminating closes everyone and deletes the room", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(await connectPeer(roomId, "Bob"));
    await settle();

    const bobClosed = bob.waitForClose();
    alice.send({ type: "terminate" });

    expect(await bobClosed).toBe(CloseCode.TERMINATED);
    expect(bob.messages).toContainEqual({ type: "terminated" });
    expect(await roomStatus(roomId)).toBe(404);
  });

  test("keeps an empty room through the grace period, then deletes it", async () => {
    const [author, roomId] = await createRoomPeer("Author");
    author.text.insert(0, "kept for a while");
    await settle();
    author.leave();
    await settle();

    expect(await roomStatus(roomId)).toBe(200);
    const returning = track(await connectPeer(roomId, "Returning"));
    expect(returning.text.toString()).toBe("kept for a while");
    returning.leave();
    peers.length = 0;

    await settle(GRACE_MS + 3000);
    expect(await roomStatus(roomId)).toBe(404);
  }, 30_000);
});
