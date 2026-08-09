/**
 * CRDT convergence tests for collaborative editing.
 * Verifies that concurrent edits from multiple peers converge to an
 * identical document, and that late joiners receive the current state.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { CodeServiceMsg, RoomServiceMsg } from "@codex/types/message";
import type { YjsUpdate } from "@codex/types/operation";
import { io as Client } from "socket.io-client";
import * as Y from "yjs";

const SERVER_URL = process.env.SERVER_URL;

/** Must match CODE_TEXT_KEY on the client and server. */
const CODE_TEXT_KEY = "monaco";

/** Byte length of a Yjs update carrying no new operations. */
const EMPTY_UPDATE_BYTES = 2;

/** How long to let updates propagate before asserting convergence. */
const SETTLE_MS = 2000;

/** Marks updates that arrived from the server, so we do not echo them back. */
const REMOTE_ORIGIN = Symbol("remote");

type ClientSocket = ReturnType<typeof Client>;

interface Peer {
  doc: Y.Doc;
  socket: ClientSocket;
  text: Y.Text;
}

const toUint8Array = (data: YjsUpdate): Uint8Array =>
  data instanceof Uint8Array ? data : new Uint8Array(data);

const settle = () =>
  new Promise<void>((resolve) => setTimeout(resolve, SETTLE_MS));

const connect = (): Promise<ClientSocket> =>
  new Promise((resolve, reject) => {
    const socket = Client(SERVER_URL);
    socket.on("connect_error", reject);
    socket.on("connect", () => resolve(socket));
  });

/**
 * Mirrors the client's yjs-doc-service transport, so this suite exercises the
 * real handshake rather than a simplified stand-in.
 */
const attachDoc = (socket: ClientSocket): Peer => {
  const doc = new Y.Doc();
  const text = doc.getText(CODE_TEXT_KEY);

  doc.on("update", (update: Uint8Array, origin: unknown) => {
    if (origin === REMOTE_ORIGIN) {
      return;
    }
    socket.emit(CodeServiceMsg.UPDATE_CODE, update);
  });

  socket.on(CodeServiceMsg.UPDATE_CODE, (update: YjsUpdate) => {
    Y.applyUpdate(doc, toUint8Array(update), REMOTE_ORIGIN);
  });

  socket.on(
    CodeServiceMsg.SYNC_CODE,
    (update: YjsUpdate, serverStateVector: YjsUpdate) => {
      Y.applyUpdate(doc, toUint8Array(update), REMOTE_ORIGIN);
      const diff = Y.encodeStateAsUpdate(doc, toUint8Array(serverStateVector));
      if (diff.length > EMPTY_UPDATE_BYTES) {
        socket.emit(CodeServiceMsg.UPDATE_CODE, diff);
      }
    }
  );

  socket.emit(CodeServiceMsg.SYNC_CODE, Y.encodeStateVector(doc));
  return { doc, socket, text };
};

const createRoom = async (name: string): Promise<[Peer, string]> => {
  const socket = await connect();
  const roomId = await new Promise<string>((resolve) => {
    socket.once(RoomServiceMsg.CREATE, (id: string) => resolve(id));
    socket.emit(RoomServiceMsg.CREATE, name);
  });
  return [attachDoc(socket), roomId];
};

const joinRoom = async (roomId: string, name: string): Promise<Peer> => {
  const socket = await connect();
  await new Promise<void>((resolve) => {
    socket.once(RoomServiceMsg.JOIN, () => resolve());
    socket.emit(RoomServiceMsg.JOIN, roomId, name);
  });
  return attachDoc(socket);
};

describe("CRDT convergence", () => {
  const peers: Peer[] = [];

  const track = (peer: Peer): Peer => {
    peers.push(peer);
    return peer;
  };

  afterEach(() => {
    for (const peer of peers) {
      peer.socket.disconnect();
      peer.doc.destroy();
    }
    peers.length = 0;
  });

  test("propagates an edit to every peer in the room", async () => {
    const [author, roomId] = await createRoom("Author");
    track(author);
    const reader = track(await joinRoom(roomId, "Reader"));
    await settle();

    author.text.insert(0, "hello world");
    await settle();

    expect(reader.text.toString()).toBe("hello world");
  });

  test("converges when peers edit concurrently at different offsets", async () => {
    const [alice, roomId] = await createRoom("Alice");
    track(alice);
    const bob = track(await joinRoom(roomId, "Bob"));
    const carol = track(await joinRoom(roomId, "Carol"));
    await settle();

    alice.text.insert(0, "0123456789");
    await settle();

    // No awaits between these three: each peer edits against the same
    // starting state, which is exactly what the old position-based
    // protocol could not reconcile.
    alice.text.insert(0, "AAA");
    bob.text.insert(10, "BBB");
    carol.text.insert(5, "CCC");
    await settle();

    const result = alice.text.toString();
    expect(bob.text.toString()).toBe(result);
    expect(carol.text.toString()).toBe(result);
    expect(result).toContain("AAA");
    expect(result).toContain("BBB");
    expect(result).toContain("CCC");
    expect(result).toHaveLength("0123456789AAABBBCCC".length);
  });

  test("converges when peers insert at the same offset", async () => {
    const [alice, roomId] = await createRoom("Alice");
    track(alice);
    const bob = track(await joinRoom(roomId, "Bob"));
    await settle();

    alice.text.insert(0, "left");
    bob.text.insert(0, "right");
    await settle();

    expect(bob.text.toString()).toBe(alice.text.toString());
    expect(alice.text.toString()).toHaveLength("leftright".length);
  });

  test("gives a late joiner the current document", async () => {
    const [author, roomId] = await createRoom("Author");
    track(author);
    await settle();

    author.text.insert(0, "written before anyone else arrived");
    await settle();

    const latecomer = track(await joinRoom(roomId, "Latecomer"));
    await settle();

    expect(latecomer.text.toString()).toBe(
      "written before anyone else arrived"
    );
  });
});
