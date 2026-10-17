/**
 * Room lifecycle and relay rules of the realtime Worker.
 * Tests:
 * - Creating and looking up rooms
 * - Rejecting unknown rooms and invalid names
 * - Video access: media tokens and the SFU proxy's membership check
 * - Terminal history for late joiners
 * - Terminating a room, and wiping it after the grace period
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  CloseCode,
  MEDIA_TOKEN_HEADER,
  ROOM_ID_HEADER,
  SFU_PROXY_PATH,
  TERMINAL_HISTORY_LIMIT,
} from "@codex/types/realtime";
import type { ExecutionResult } from "@codex/types/terminal";

import {
  connectPeer,
  createRoomId,
  createRoomPeer,
  roomStatus,
  SERVER_URL,
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

const mediaOf = (peer: TestPeer) => {
  const message = peer.messages.find((m) => m.type === "media");
  return message?.type === "media" ? message : null;
};

const mediaTokenOf = (peer: TestPeer) => mediaOf(peer)?.token ?? "";

// Video is on when the developer has SFU credentials in .dev.vars, which
// wrangler dev always loads
const isMediaEnabled = (peer: TestPeer) => mediaOf(peer)?.enabled === true;

// Opens an SFU session through the proxy, as PartyTracks does first
const openSfuSession = async (headers: Record<string, string>) =>
  (
    await fetch(`${SERVER_URL}${SFU_PROXY_PATH}/sessions/new`, {
      method: "POST",
      headers,
    })
  ).status;

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

  test("gives each connection its own media token", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(await connectPeer(roomId, "Bob"));
    await settle();

    expect(mediaOf(alice)?.enabled).toEqual(expect.any(Boolean));
    expect(mediaTokenOf(alice)).not.toBe("");
    expect(mediaTokenOf(bob)).not.toBe(mediaTokenOf(alice));
  });

  test("only lets current room members through the SFU proxy", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const [bob, otherRoomId] = await createRoomPeer("Bob");
    track(bob);
    await settle();
    const member = {
      [ROOM_ID_HEADER]: roomId,
      [MEDIA_TOKEN_HEADER]: mediaTokenOf(alice),
    };

    expect(
      await openSfuSession({ ...member, Origin: "https://example.com" })
    ).toBe(403);
    expect(await openSfuSession({})).toBe(401);
    expect(
      await openSfuSession({ ...member, [MEDIA_TOKEN_HEADER]: "not-a-token" })
    ).toBe(401);
    expect(
      await openSfuSession({ ...member, [ROOM_ID_HEADER]: otherRoomId })
    ).toBe(401);
    // A member gets through: the SFU opens a session, or the Worker says
    // video isn't set up when it has no credentials
    const memberStatus = await openSfuSession(member);
    if (isMediaEnabled(alice)) {
      expect(memberStatus).toBeLessThan(400);
    } else {
      expect(memberStatus).toBe(503);
    }

    alice.leave();
    await settle();
    expect(await openSfuSession(member)).toBe(401);
  });

  test("relays the tracks someone publishes", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(await connectPeer(roomId, "Bob"));
    await settle();
    const video = { sessionId: "session-1", trackName: "camera-1" };

    bob.setPresence({
      media: {
        camera: true,
        mic: false,
        screen: false,
        speaker: true,
        tracks: { video },
      },
    });
    await settle();

    expect(alice.presenceOf(bob.clientId)?.media.tracks?.video).toEqual(video);
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
