/**
 * CRDT convergence tests for collaborative editing.
 * Verifies that concurrent edits from multiple peers converge to an
 * identical document, and that late joiners receive the current state.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  connectPeer,
  createRoomPeer,
  type TestPeer,
  settle as wait,
} from "./helpers";

/** How long to let updates propagate before asserting convergence. */
const SETTLE_MS = 2000;

const settle = () => wait(SETTLE_MS);

const createRoom = (name: string) => createRoomPeer(name);

const joinRoom = (roomId: string, name: string) => connectPeer(roomId, name);

describe("CRDT convergence", () => {
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
