/**
 * One live connection to a room: the shared Yjs document, presence
 * (awareness), and the custom messages that travel alongside them.
 * Reconnecting and re-syncing are handled by y-partyserver's provider.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  type ClientMessage,
  CloseCode,
  type Presence,
  ROOM_PARTY,
  type ServerMessage,
} from "@codex/types/realtime";
import YProvider from "y-partyserver/provider";
import type { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";

import { BASE_SERVER_URL } from "@/lib/constants";

export type EndReason = "not-found" | "terminated";

type MessageOf<T extends ServerMessage["type"]> = Extract<
  ServerMessage,
  { type: T }
>;

export interface RoomConnection {
  readonly awareness: Awareness;
  readonly clientId: number;
  destroy: () => void;
  readonly doc: Y.Doc;
  // Everyone's presence keyed by Yjs client ID; a new Map after each change
  getPresence: () => Map<number, Presence>;
  isSynced: () => boolean;
  onEnd: (handler: (reason: EndReason) => void) => () => void;
  onMessage: <T extends ServerMessage["type"]>(
    type: T,
    handler: (message: MessageOf<T>) => void
  ) => () => void;
  onSynced: (handler: () => void) => () => void;
  send: (message: ClientMessage) => void;
  setPresence: (patch: Partial<Presence>) => void;
  subscribePresence: (listener: () => void) => () => void;
}

const END_REASONS: Record<number, EndReason> = {
  [CloseCode.ROOM_NOT_FOUND]: "not-found",
  [CloseCode.TERMINATED]: "terminated",
};

const parseServerMessage = (raw: string): ServerMessage | null => {
  try {
    const message: unknown = JSON.parse(raw);
    return typeof message === "object" && message !== null && "type" in message
      ? (message as ServerMessage)
      : null;
  } catch {
    return null;
  }
};

export const connectToRoom = (roomId: string, name: string): RoomConnection => {
  const server = new URL(BASE_SERVER_URL);
  const doc = new Y.Doc();
  const provider = new YProvider(server.host, roomId, doc, {
    party: ROOM_PARTY,
    protocol: server.protocol === "https:" ? "wss" : "ws",
    disableBc: true,
  });

  const presence: Presence = {
    user: { name },
    media: { camera: false, mic: false, speaker: true },
  };
  provider.awareness.setLocalState(presence);

  const messageHandlers = new Set<(message: ServerMessage) => void>();
  const endHandlers = new Set<(reason: EndReason) => void>();
  const presenceListeners = new Set<() => void>();

  const readStates = () =>
    new Map(provider.awareness.getStates()) as Map<number, Presence>;
  let presenceSnapshot = readStates();
  provider.awareness.on("change", () => {
    presenceSnapshot = readStates();
    for (const listener of presenceListeners) {
      listener();
    }
  });

  provider.on("custom-message", (raw: string) => {
    const message = parseServerMessage(raw);
    if (message) {
      for (const handler of messageHandlers) {
        handler(message);
      }
    }
  });

  // These closes are final, so stop the provider from reconnecting
  provider.on("connection-close", (event: CloseEvent | null) => {
    const reason = event ? END_REASONS[event.code] : undefined;
    if (reason) {
      provider.disconnect();
      for (const handler of endHandlers) {
        handler(reason);
      }
    }
  });

  return {
    doc,
    awareness: provider.awareness,
    clientId: doc.clientID,

    send: (message) => provider.sendMessage(JSON.stringify(message)),

    onMessage: (type, handler) => {
      const listener = (message: ServerMessage) => {
        if (message.type === type) {
          handler(message as MessageOf<typeof type>);
        }
      };
      messageHandlers.add(listener);
      return () => messageHandlers.delete(listener);
    },

    onEnd: (handler) => {
      endHandlers.add(handler);
      return () => endHandlers.delete(handler);
    },

    isSynced: () => provider.synced,

    getPresence: () => presenceSnapshot,

    subscribePresence: (listener) => {
      presenceListeners.add(listener);
      return () => presenceListeners.delete(listener);
    },

    onSynced: (handler) => {
      const listener = (isSynced: boolean) => {
        if (isSynced) {
          handler();
        }
      };
      provider.on("sync", listener);
      return () => provider.off("sync", listener);
    },

    setPresence: (patch) => {
      const current = provider.awareness.getLocalState() as Presence | null;
      provider.awareness.setLocalState({ ...(current ?? presence), ...patch });
    },

    destroy: () => {
      messageHandlers.clear();
      endHandlers.clear();
      presenceListeners.clear();
      provider.destroy();
      doc.destroy();
    },
  };
};
