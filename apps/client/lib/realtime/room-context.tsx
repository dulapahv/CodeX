/**
 * React access to the current room connection: the connection itself,
 * selected parts of everyone's presence, the user list, and custom messages.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import type { Presence, RoomRole, ServerMessage } from "@codex/types/realtime";
import type { User } from "@codex/types/user";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";

import type { RoomConnection } from "./room-connection";

const RoomContext = createContext<RoomConnection | null>(null);

export const RoomProvider = ({
  children,
  connection,
}: {
  children: ReactNode;
  connection: RoomConnection | null;
}) => (
  <RoomContext.Provider value={connection}>{children}</RoomContext.Provider>
);

// Null until the room connects
export const useRoomConnection = (): RoomConnection | null =>
  useContext(RoomContext);

export const useRoom = (): RoomConnection => {
  const connection = useRoomConnection();
  if (!connection) {
    throw new Error("useRoom must be used inside a connected RoomProvider");
  }
  return connection;
};

const NO_PRESENCE = new Map<number, Presence>();
const subscribeNothing = () => () => undefined;

/**
 * Selects part of everyone's presence and re-renders only when that part
 * changes, so cursor and pointer traffic doesn't re-render unrelated UI.
 * Before the room connects it selects from an empty room.
 */
export const usePresenceSelector = <T,>(
  select: (states: Map<number, Presence>) => T,
  isEqual: (previous: T, next: T) => boolean
): T => {
  const connection = useContext(RoomContext);
  const cache = useRef<{ states: Map<number, Presence>; value: T } | null>(
    null
  );

  const getSnapshot = () => {
    const states = connection?.getPresence() ?? NO_PRESENCE;
    const cached = cache.current;
    if (cached?.states === states) {
      return cached.value;
    }
    const next = select(states);
    const value = cached && isEqual(cached.value, next) ? cached.value : next;
    cache.current = { states, value };
    return value;
  };

  return useSyncExternalStore(
    connection?.subscribePresence ?? subscribeNothing,
    getSnapshot,
    getSnapshot
  );
};

const toUsers = (states: Map<number, Presence>): User[] =>
  [...states]
    .filter(([, state]) => typeof state?.user?.name === "string")
    .map(([clientId, state]) => ({
      id: String(clientId),
      username: state.user.name,
    }));

const isSameUsers = (previous: User[], next: User[]) =>
  previous.length === next.length &&
  previous.every(
    (user, index) =>
      user.id === next[index]?.id && user.username === next[index]?.username
  );

// Everyone in the room, including this client
export const useRoomUsers = (): User[] =>
  usePresenceSelector(toUsers, isSameUsers);

const getNoAccess = () => null;

export const VIEW_ONLY_MESSAGE =
  "You can only view this room. Ask the host if you'd like to edit.";

export interface RoomAccessView {
  canEdit: boolean;
  isHost: boolean;
  // False until the server first says, so a change can be told from the start
  isKnown: boolean;
  isLocked: boolean;
  // Takes a user ID, the Yjs client ID as a string
  roleOf: (userId: string) => RoomRole;
}

// What this person may do, and everyone's role. Until the server says,
// everyone can edit, as on a server from before roles.
export const useRoomAccess = (): RoomAccessView => {
  const connection = useContext(RoomContext);
  const access = useSyncExternalStore(
    connection?.subscribeAccess ?? subscribeNothing,
    connection?.getAccess ?? getNoAccess,
    getNoAccess
  );

  const roleOf = (userId: string): RoomRole => {
    const clientId = Number(userId);
    if (access?.hostIds.includes(clientId)) {
      return "host";
    }
    return access?.viewerIds.includes(clientId) ? "viewer" : "editor";
  };
  const ownRole = connection ? roleOf(String(connection.clientId)) : "editor";

  return {
    canEdit: ownRole !== "viewer",
    isHost: ownRole === "host",
    isKnown: access !== null,
    isLocked: access?.locked ?? false,
    roleOf,
  };
};

export const useRoomMessage = <T extends ServerMessage["type"]>(
  type: T,
  handler: (message: Extract<ServerMessage, { type: T }>) => void
) => {
  const connection = useContext(RoomContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(
    () => connection?.onMessage(type, (message) => handlerRef.current(message)),
    [connection, type]
  );
};
