/**
 * Test client for the realtime Worker: a y-partyserver provider over the
 * `ws` package, with promise helpers for waiting on document, presence and
 * message traffic.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type {
  ClientMessage,
  Presence,
  ServerMessage,
} from "@codex/types/realtime";
import { ROOM_DOC, ROOM_PARTY } from "@codex/types/realtime";
import WebSocket from "ws";
import YProvider from "y-partyserver/provider";
import * as Y from "yjs";

export const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001";

const SYNC_TIMEOUT_MS = 10_000;

interface AwarenessChange {
  added: number[];
  removed: number[];
  updated: number[];
}

export interface TestPeer {
  readonly clientId: number;
  readonly closeCodes: number[];
  readonly doc: Y.Doc;
  leave: () => void;
  readonly messages: ServerMessage[];
  nextDocUpdate: () => Promise<void>;
  nextMessage: (type: ServerMessage["type"]) => Promise<ServerMessage>;
  nextPresenceUpdate: (fromClientId: number) => Promise<void>;
  presenceOf: (clientId: number) => Presence | undefined;
  send: (message: ClientMessage) => void;
  setPresence: (patch: Partial<Presence>) => void;
  readonly text: Y.Text;
  waitForClose: () => Promise<number>;
}

export const settle = (ms = 1000) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const createRoomId = async (): Promise<string> => {
  const response = await fetch(`${SERVER_URL}/rooms`, { method: "POST" });
  const { roomId } = (await response.json()) as { roomId: string };
  return roomId;
};

export const roomStatus = async (roomId: string): Promise<number> =>
  (await fetch(`${SERVER_URL}/rooms/${roomId}`)).status;

export const connectPeer = async (
  roomId: string,
  name: string,
  { waitForSync = true } = {}
): Promise<TestPeer> => {
  const server = new URL(SERVER_URL);
  const doc = new Y.Doc();
  const provider = new YProvider(server.host, roomId, doc, {
    party: ROOM_PARTY,
    protocol: server.protocol === "https:" ? "wss" : "ws",
    WebSocketPolyfill: WebSocket as unknown as typeof globalThis.WebSocket,
    disableBc: true,
  });
  provider.awareness.setLocalState({
    user: { name },
    media: { camera: false, mic: false, screen: false, speaker: true },
  } satisfies Presence);

  const messages: ServerMessage[] = [];
  const messageWaiters = new Set<(message: ServerMessage) => void>();
  provider.on("custom-message", (raw: string) => {
    const message = JSON.parse(raw) as ServerMessage;
    messages.push(message);
    for (const waiter of messageWaiters) {
      waiter(message);
    }
  });

  const closeCodes: number[] = [];
  const closeWaiters = new Set<(code: number) => void>();
  provider.on("connection-close", (event: { code: number } | null) => {
    const code = event?.code ?? 0;
    closeCodes.push(code);
    // 4xxx closes are final; don't let the provider retry
    if (code >= 4000) {
      provider.disconnect();
    }
    for (const waiter of closeWaiters) {
      waiter(code);
    }
  });

  if (waitForSync) {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`${name} did not sync`)),
        SYNC_TIMEOUT_MS
      );
      provider.on("sync", (isSynced: boolean) => {
        if (isSynced) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }

  return {
    clientId: doc.clientID,
    doc,
    text: doc.getText(ROOM_DOC.code),
    messages,
    closeCodes,

    send: (message) => provider.sendMessage(JSON.stringify(message)),

    setPresence: (patch) => {
      const current = provider.awareness.getLocalState() as Presence;
      provider.awareness.setLocalState({ ...current, ...patch });
    },

    presenceOf: (clientId) =>
      provider.awareness.getStates().get(clientId) as Presence | undefined,

    nextDocUpdate: () =>
      new Promise((resolve) => {
        const handleUpdate = () => {
          doc.off("update", handleUpdate);
          resolve();
        };
        doc.on("update", handleUpdate);
      }),

    nextPresenceUpdate: (fromClientId) =>
      new Promise((resolve) => {
        const handleUpdate = ({ added, updated }: AwarenessChange) => {
          if ([...added, ...updated].includes(fromClientId)) {
            provider.awareness.off("update", handleUpdate);
            resolve();
          }
        };
        provider.awareness.on("update", handleUpdate);
      }),

    nextMessage: (type) =>
      new Promise((resolve) => {
        const waiter = (message: ServerMessage) => {
          if (message.type === type) {
            messageWaiters.delete(waiter);
            resolve(message);
          }
        };
        messageWaiters.add(waiter);
      }),

    waitForClose: () =>
      new Promise((resolve) => {
        const waiter = (code: number) => {
          closeWaiters.delete(waiter);
          resolve(code);
        };
        closeWaiters.add(waiter);
      }),

    leave: () => {
      provider.destroy();
      doc.destroy();
    },
  };
};

export const createRoomPeer = async (
  name: string
): Promise<[TestPeer, string]> => {
  const roomId = await createRoomId();
  return [await connectPeer(roomId, name), roomId];
};

export const calculateStats = (samples: number[]) => {
  const average = samples.reduce((a, b) => a + b) / samples.length;
  const standardDeviation = Math.sqrt(
    samples.reduce((acc, val) => acc + (val - average) ** 2, 0) / samples.length
  );
  return {
    average,
    standardDeviation,
    minimum: Math.min(...samples),
    maximum: Math.max(...samples),
  };
};
