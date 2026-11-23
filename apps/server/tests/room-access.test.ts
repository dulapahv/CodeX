/**
 * Who may do what in a room.
 * Tests:
 * - Only the host terminates the room, locks it, changes roles or removes
 *   people, and a removed browser stays out
 * - A locked room turns newcomers away but lets members back in
 * - One host at a time, and one connection for each seat
 * - The host handing the room to someone else
 * - Viewers' edits and runs stay with them, through reconnects
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { CloseCode } from "@codex/types/realtime";
import type { ExecutionResult } from "@codex/types/terminal";

import {
  connectPeer,
  createRoom,
  createRoomPeer,
  roomStatus,
  settle,
  type TestPeer,
} from "./helpers";

const RUN: ExecutionResult = {
  language: "python",
  run: { code: 0, output: "hi", signal: null, stderr: "", stdout: "hi" },
  version: "3.12",
};

describe("Room access", () => {
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

  it("tells everyone who the host is", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(await connectPeer(roomId, "Bob"));
    await settle();

    expect(bob.access()).toEqual({
      hostIds: [alice.clientId],
      locked: false,
      type: "access",
      viewerIds: [],
    });
    expect(bob.token()).toEqual(expect.any(String));
  });

  it("lets only the host terminate the room", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(await connectPeer(roomId, "Bob"));
    await settle();

    bob.send({ type: "terminate" });
    await settle();
    expect(await roomStatus(roomId)).toBe(200);

    const bobClosed = bob.waitForClose();
    alice.send({ type: "terminate" });
    expect(await bobClosed).toBe(CloseCode.TERMINATED);
  });

  it("turns newcomers away from a locked room but lets members back in", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = await connectPeer(roomId, "Bob");
    await settle();
    const bobToken = bob.token();

    alice.send({ locked: true, type: "lock" });
    await settle();
    expect(bob.access()?.locked).toBe(true);

    const carol = track(
      await connectPeer(roomId, "Carol", { waitForSync: false })
    );
    expect(await carol.waitForClose()).toBe(CloseCode.ROOM_LOCKED);

    bob.leave();
    track(await connectPeer(roomId, "Bob", { token: bobToken }));

    alice.send({ locked: false, type: "lock" });
    await settle();
    track(await connectPeer(roomId, "Dave"));
  });

  it("tells someone a room is locked before they connect", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(await connectPeer(roomId, "Bob"));
    await settle();
    alice.send({ locked: true, type: "lock" });
    await settle();

    expect(await roomStatus(roomId)).toBe(423);
    expect(await roomStatus(roomId, { token: bob.token() })).toBe(200);
  });

  it("makes a second tab with the host's key a member, and the host once the host has gone", async () => {
    const { hostToken, roomId } = await createRoom();
    const alice = await connectPeer(roomId, "Alice", {
      hostKey: hostToken,
      token: hostToken,
    });
    const secondTab = track(
      await connectPeer(roomId, "Alice too", { hostKey: hostToken })
    );
    await settle();
    expect(secondTab.access()?.hostIds).toEqual([alice.clientId]);

    alice.leave();
    await settle();
    const thirdTab = track(
      await connectPeer(roomId, "Alice again", { hostKey: hostToken })
    );
    await settle();
    expect(thirdTab.access()?.hostIds).toEqual([thirdTab.clientId]);
  });

  it("closes an older connection when its seat connects again", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(await connectPeer(roomId, "Bob"));
    await settle();

    const bobClosed = bob.waitForClose();
    track(await connectPeer(roomId, "Bob", { token: bob.token() }));

    expect(await bobClosed).toBe(CloseCode.REPLACED);
  });

  it("lets the host remove someone, who can't come back from that browser", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(
      await connectPeer(roomId, "Bob", { browser: "bobs-browser" })
    );
    await settle();

    const bobClosed = bob.waitForClose();
    alice.send({ clientId: bob.clientId, type: "remove" });
    expect(await bobClosed).toBe(CloseCode.REMOVED);

    expect(await roomStatus(roomId, { browser: "bobs-browser" })).toBe(403);
    const bobAgain = track(
      await connectPeer(roomId, "Bob", {
        browser: "bobs-browser",
        waitForSync: false,
      })
    );
    expect(await bobAgain.waitForClose()).toBe(CloseCode.REMOVED);
    track(await connectPeer(roomId, "Carol", { browser: "carols-browser" }));
  });

  it("ignores removals from anyone but the host, and keeps the host's browser in", async () => {
    const { hostToken, roomId } = await createRoom();
    const alice = track(
      await connectPeer(roomId, "Alice", {
        browser: "alices-browser",
        hostKey: hostToken,
        token: hostToken,
      })
    );
    const bob = track(await connectPeer(roomId, "Bob"));
    const secondTab = track(
      await connectPeer(roomId, "Alice too", {
        browser: "alices-browser",
        hostKey: hostToken,
      })
    );
    await settle();

    bob.send({ clientId: alice.clientId, type: "remove" });
    alice.send({ clientId: alice.clientId, type: "remove" });
    const secondTabClosed = secondTab.waitForClose();
    alice.send({ clientId: secondTab.clientId, type: "remove" });

    expect(await secondTabClosed).toBe(CloseCode.REMOVED);
    expect(alice.closeCodes).toEqual([]);
    expect(
      await roomStatus(roomId, { browser: "alices-browser", token: hostToken })
    ).toBe(200);
  });

  it("lets the host hand the room to someone else, who keeps it", async () => {
    // Left by hand below, so not tracked
    const [alice, roomId] = await createRoomPeer("Alice");
    const aliceToken = alice.token();
    const bob = await connectPeer(roomId, "Bob");
    await settle();

    alice.send({ clientId: bob.clientId, type: "make-host" });
    await settle();
    expect(alice.access()?.hostIds).toEqual([bob.clientId]);

    // Alice can't host any more, but still edits
    alice.send({ locked: true, type: "lock" });
    alice.text.insert(0, "still editing");
    await settle();
    expect(bob.access()?.locked).toBe(false);
    expect(bob.text.toString()).toBe("still editing");

    // Bob stays the host when he comes back
    const bobToken = bob.token();
    bob.leave();
    const bobAgain = track(
      await connectPeer(roomId, "Bob", { token: bobToken })
    );
    await settle();
    bobAgain.send({ locked: true, type: "lock" });
    await settle();
    expect(alice.access()?.hostIds).toEqual([bobAgain.clientId]);
    expect(alice.access()?.locked).toBe(true);

    // Alice's old seat and host key don't make her the host again
    alice.leave();
    const aliceAgain = track(
      await connectPeer(roomId, "Alice", {
        hostKey: aliceToken,
        token: aliceToken,
      })
    );
    await settle();
    expect(aliceAgain.access()?.hostIds).toEqual([bobAgain.clientId]);
  });

  it("ignores a handover from anyone but the host", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(await connectPeer(roomId, "Bob"));
    const carol = track(await connectPeer(roomId, "Carol"));
    await settle();

    bob.send({ clientId: carol.clientId, type: "make-host" });
    bob.send({ clientId: bob.clientId, type: "make-host" });
    await settle();

    expect(carol.access()?.hostIds).toEqual([alice.clientId]);
  });

  it("ignores a lock from anyone but the host", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(await connectPeer(roomId, "Bob"));
    await settle();

    bob.send({ locked: true, type: "lock" });
    await settle();

    expect(alice.access()?.locked).toBe(false);
    track(await connectPeer(roomId, "Carol"));
  });

  it("keeps a viewer's edits and runs to themselves", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(await connectPeer(roomId, "Bob"));
    await settle();

    alice.send({ clientId: bob.clientId, role: "viewer", type: "set-role" });
    await settle();
    expect(alice.access()?.viewerIds).toEqual([bob.clientId]);

    bob.text.insert(0, "from a viewer");
    bob.send({ result: RUN, type: "terminal" });
    await settle();

    expect(alice.text.toString()).toBe("");
    expect(alice.messages.some(({ type }) => type === "terminal")).toBe(false);
  });

  it("keeps a viewer a viewer when they come back, until the host lets them edit", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = await connectPeer(roomId, "Bob");
    await settle();
    alice.send({ clientId: bob.clientId, role: "viewer", type: "set-role" });
    await settle();

    const bobToken = bob.token();
    bob.leave();
    const bobAgain = track(
      await connectPeer(roomId, "Bob", { token: bobToken })
    );
    await settle();
    expect(alice.access()?.viewerIds).toEqual([bobAgain.clientId]);

    alice.send({
      clientId: bobAgain.clientId,
      role: "editor",
      type: "set-role",
    });
    await settle();
    bobAgain.text.insert(0, "now editing");
    await settle();

    expect(alice.access()?.viewerIds).toEqual([]);
    expect(alice.text.toString()).toBe("now editing");
  });

  it("ignores role changes from anyone but the host, and keeps the host a host", async () => {
    const [alice, roomId] = await createRoomPeer("Alice");
    track(alice);
    const bob = track(await connectPeer(roomId, "Bob"));
    const carol = track(await connectPeer(roomId, "Carol"));
    await settle();

    bob.send({ clientId: carol.clientId, role: "viewer", type: "set-role" });
    bob.send({ clientId: alice.clientId, role: "viewer", type: "set-role" });
    alice.send({ clientId: alice.clientId, role: "viewer", type: "set-role" });
    await settle();
    alice.text.insert(0, "still the host");
    await settle();

    expect(carol.access()?.viewerIds).toEqual([]);
    expect(carol.access()?.hostIds).toEqual([alice.clientId]);
    expect(carol.text.toString()).toBe("still the host");
  });
});
