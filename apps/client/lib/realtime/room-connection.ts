/**
 * One live connection to a room: the shared Yjs document, presence
 * (awareness), and the custom messages that travel alongside them.
 * Reconnecting and re-syncing are handled by y-partyserver's provider.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  CLIENT_ID_PARAM,
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

import { getSeatClaim, hostKeys, seats } from "./room-tokens";

export type EndReason =
  | "locked"
  | "not-found"
  | "removed"
  | "replaced"
  | "terminated";

// From the room's `media` message: whether video is set up, and the token
// that lets this connection use the SFU proxy
export interface MediaAccess {
  enabled: boolean;
  token: string;
}

// The room's `access` message, saying who hosts, who can only view, and
// whether newcomers are kept out
export type RoomAccess = Omit<MessageOf<"access">, "type">;

type MessageOf<T extends ServerMessage["type"]> = Extract<
  ServerMessage,
  { type: T }
>;

export interface RoomConnection {
  readonly awareness: Awareness;
  readonly clientId: number;
  destroy: () => void;
  readonly doc: Y.Doc;
  // Null until the server's first `access` message
  getAccess: () => RoomAccess | null;
  // Null until the server's first `media` message; replaced on reconnect
  getMediaAccess: () => MediaAccess | null;
  // Everyone's presence keyed by Yjs client ID; a new Map after each change
  getPresence: () => Map<number, Presence>;
  isSynced: () => boolean;
  onEnd: (handler: (reason: EndReason) => void) => () => void;
  onMessage: <T extends ServerMessage["type"]>(
    type: T,
    handler: (message: MessageOf<T>) => void
  ) => () => void;
  onSynced: (handler: () => void) => () => void;
  readonly roomId: string;
  send: (message: ClientMessage) => void;
  setPresence: (patch: Partial<Presence>) => void;
  subscribeAccess: (listener: () => void) => () => void;
  subscribeMediaAccess: (listener: () => void) => () => void;
  subscribePresence: (listener: () => void) => () => void;
}

const END_REASONS: Record<number, EndReason> = {
  [CloseCode.REMOVED]: "removed",
  [CloseCode.REPLACED]: "replaced",
  [CloseCode.ROOM_LOCKED]: "locked",
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
    connect: false,
    disableBc: true,
    // Read on every reconnect, so it carries the seat the room gave us
    params: () => ({
      [CLIENT_ID_PARAM]: String(doc.clientID),
      ...getSeatClaim(roomId),
    }),
    party: ROOM_PARTY,
    protocol: server.protocol === "https:" ? "wss" : "ws",
  });
  // Opened on the next tick, so a connection destroyed straight away, as in
  // React's dev double mount, never reaches the room. That one would share
  // this tab's seat, and could take it from the connection that stays.
  let isDestroyed = false;
  const connectTimer = setTimeout(() => {
    // connect() reads the params first, and then opens the socket even if
    // the connection was destroyed meanwhile
    provider
      .connect()
      .then(() => {
        if (isDestroyed) {
          provider.disconnect();
        }
      })
      .catch(() => undefined);
  }, 0);

  const presence: Presence = {
    media: { camera: false, mic: false, screen: false, speaker: true },
    user: { name },
  };
  provider.awareness.setLocalState(presence);

  const messageHandlers = new Set<(message: ServerMessage) => void>();
  const endHandlers = new Set<(reason: EndReason) => void>();
  const presenceListeners = new Set<() => void>();
  const mediaAccessListeners = new Set<() => void>();
  const accessListeners = new Set<() => void>();
  let mediaAccess: MediaAccess | null = null;
  let access: RoomAccess | null = null;

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
    if (!message) {
      return;
    }
    // Kept rather than only dispatched, since it arrives before most
    // components subscribe
    if (message.type === "media") {
      mediaAccess = { enabled: message.enabled, token: message.token };
      for (const listener of mediaAccessListeners) {
        listener();
      }
    } else if (message.type === "access") {
      const { hostIds, locked, viewerIds } = message;
      access = { hostIds, locked, viewerIds };
      // A tab made the host keeps its seat as this browser's host key, so
      // the host's seat can be taken back after closing it
      const seat = seats.get(roomId);
      if (seat && hostIds.includes(doc.clientID)) {
        hostKeys.save(roomId, seat);
      }
      for (const listener of accessListeners) {
        listener();
      }
    } else if (message.type === "token") {
      seats.save(roomId, message.token);
    }
    for (const handler of messageHandlers) {
      handler(message);
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
    awareness: provider.awareness,
    clientId: doc.clientID,

    destroy: () => {
      clearTimeout(connectTimer);
      isDestroyed = true;
      messageHandlers.clear();
      endHandlers.clear();
      presenceListeners.clear();
      mediaAccessListeners.clear();
      accessListeners.clear();
      provider.destroy();
      doc.destroy();
    },
    doc,

    getAccess: () => access,

    getMediaAccess: () => mediaAccess,

    getPresence: () => presenceSnapshot,

    isSynced: () => provider.synced,

    onEnd: (handler) => {
      endHandlers.add(handler);
      return () => endHandlers.delete(handler);
    },

    onMessage: (type, handler) => {
      const listener = (message: ServerMessage) => {
        if (message.type === type) {
          handler(message as MessageOf<typeof type>);
        }
      };
      messageHandlers.add(listener);
      return () => messageHandlers.delete(listener);
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
    roomId,

    send: (message) => provider.sendMessage(JSON.stringify(message)),

    setPresence: (patch) => {
      const current = provider.awareness.getLocalState() as Presence | null;
      provider.awareness.setLocalState({ ...(current ?? presence), ...patch });
    },

    subscribeAccess: (listener) => {
      accessListeners.add(listener);
      return () => accessListeners.delete(listener);
    },

    subscribeMediaAccess: (listener) => {
      mediaAccessListeners.add(listener);
      return () => mediaAccessListeners.delete(listener);
    },

    subscribePresence: (listener) => {
      presenceListeners.add(listener);
      return () => presenceListeners.delete(listener);
    },
  };
};
