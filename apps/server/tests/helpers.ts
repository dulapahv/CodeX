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
import {
  BROWSER_ID_PARAM,
  CLIENT_ID_PARAM,
  HOST_KEY_PARAM,
  ROOM_DOC,
  ROOM_PARTY,
  ROOM_TOKEN_PARAM,
} from "@codex/types/realtime";
import * as encoding from "lib0/encoding";
import WebSocket from "ws";
import YProvider from "y-partyserver/provider";
import * as Y from "yjs";

export const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001";

const SYNC_TIMEOUT_MS = 10_000;
const MESSAGE_AWARENESS = 1;

interface AwarenessChange {
  added: number[];
  removed: number[];
  updated: number[];
}

export interface TestPeer {
  // The latest access message, and the room token the server gave this peer
  access: () => Extract<ServerMessage, { type: "access" }> | undefined;
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
  // Presence for any client sent through this peer's connection, as each
  // client echoes the presence it hears
  sendPresenceFor: (
    clientId: number,
    clock: number,
    presence: Presence
  ) => void;
  setPresence: (patch: Partial<Presence>) => void;
  readonly text: Y.Text;
  token: () => string | undefined;
  waitForClose: () => Promise<number>;
}

const lastOfType = <T extends ServerMessage["type"]>(
  messages: ServerMessage[],
  type: T
) =>
  messages.findLast(
    (message): message is Extract<ServerMessage, { type: T }> =>
      message.type === type
  );

export const settle = (ms = 1000) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const createRoom = async () => {
  const response = await fetch(`${SERVER_URL}/rooms`, { method: "POST" });
  return (await response.json()) as { hostToken: string; roomId: string };
};

export const createRoomId = async (): Promise<string> =>
  (await createRoom()).roomId;

export interface Seat {
  browser?: string;
  hostKey?: string;
  token?: string;
}

const seatParams = ({ browser, hostKey, token }: Seat) => ({
  ...(browser && { [BROWSER_ID_PARAM]: browser }),
  ...(hostKey && { [HOST_KEY_PARAM]: hostKey }),
  ...(token && { [ROOM_TOKEN_PARAM]: token }),
});

// The check the join form makes, so it can say why someone can't join
export const roomStatus = async (
  roomId: string,
  seat: Seat = {}
): Promise<number> => {
  const query = new URLSearchParams(seatParams(seat)).toString();
  return (await fetch(`${SERVER_URL}/rooms/${roomId}?${query}`)).status;
};

export const connectPeer = async (
  roomId: string,
  name: string,
  { waitForSync = true, ...seat }: Seat & { waitForSync?: boolean } = {}
): Promise<TestPeer> => {
  const server = new URL(SERVER_URL);
  const doc = new Y.Doc();
  const provider = new YProvider(server.host, roomId, doc, {
    disableBc: true,
    params: { [CLIENT_ID_PARAM]: String(doc.clientID), ...seatParams(seat) },
    party: ROOM_PARTY,
    protocol: server.protocol === "https:" ? "wss" : "ws",
    WebSocketPolyfill: WebSocket as unknown as typeof globalThis.WebSocket,
  });
  provider.awareness.setLocalState({
    media: { camera: false, mic: false, screen: false, speaker: true },
    user: { name },
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
    access: () => lastOfType(messages, "access"),
    clientId: doc.clientID,
    closeCodes,
    doc,

    leave: () => {
      provider.destroy();
      doc.destroy();
    },
    messages,

    nextDocUpdate: () =>
      new Promise((resolve) => {
        const handleUpdate = () => {
          doc.off("update", handleUpdate);
          resolve();
        };
        doc.on("update", handleUpdate);
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

    presenceOf: (clientId) =>
      provider.awareness.getStates().get(clientId) as Presence | undefined,

    send: (message) => provider.sendMessage(JSON.stringify(message)),

    sendPresenceFor: (clientId, clock, presence) => {
      const update = encoding.createEncoder();
      encoding.writeVarUint(update, 1);
      encoding.writeVarUint(update, clientId);
      encoding.writeVarUint(update, clock);
      encoding.writeVarString(update, JSON.stringify(presence));
      const message = encoding.createEncoder();
      encoding.writeVarUint(message, MESSAGE_AWARENESS);
      encoding.writeVarUint8Array(message, encoding.toUint8Array(update));
      provider.ws?.send(encoding.toUint8Array(message));
    },

    setPresence: (patch) => {
      const current = provider.awareness.getLocalState() as Presence;
      provider.awareness.setLocalState({ ...current, ...patch });
    },
    text: doc.getText(ROOM_DOC.code),
    token: () => lastOfType(messages, "token")?.token,

    waitForClose: () =>
      new Promise((resolve) => {
        const waiter = (code: number) => {
          closeWaiters.delete(waiter);
          resolve(code);
        };
        closeWaiters.add(waiter);
      }),
  };
};

// The peer creates the room, so it's the host
export const createRoomPeer = async (
  name: string,
  { browser }: { browser?: string } = {}
): Promise<[TestPeer, string]> => {
  const { hostToken, roomId } = await createRoom();
  const seat = { browser, hostKey: hostToken, token: hostToken };
  return [await connectPeer(roomId, name, seat), roomId];
};

export const calculateStats = (samples: number[]) => {
  const average = samples.reduce((a, b) => a + b) / samples.length;
  const standardDeviation = Math.sqrt(
    samples.reduce((acc, val) => acc + (val - average) ** 2, 0) / samples.length
  );
  return {
    average,
    maximum: Math.max(...samples),
    minimum: Math.min(...samples),
    standardDeviation,
  };
};
