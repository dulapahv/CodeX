/**
 * Shared contract between the realtime Worker and the client: the room's
 * Yjs document keys, per-user presence (Yjs awareness), the custom messages
 * sent alongside Yjs, and the close codes that end a session.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Cursor } from "./operation";
import type { Pointer } from "./pointer";
import type { Scroll } from "./scroll";
import type { ExecutionResult } from "./terminal";

// The PartyServer party (Durable Object) every room connects to
export const ROOM_PARTY = "room";

export const ROOM_DOC = {
  code: "code",
  meta: "meta",
  notes: "notes",
} as const;

export const META_LANGUAGE = "language";
export const DEFAULT_LANGUAGE = "python";

export const MAX_NAME_LENGTH = 64;
export const TERMINAL_HISTORY_LIMIT = 50;

export const CloseCode = {
  ROOM_NOT_FOUND: 4404,
  TERMINATED: 4001,
} as const;

export interface PresenceMedia {
  camera: boolean;
  mic: boolean;
  speaker: boolean;
}

export interface Presence {
  cursor?: Cursor;
  media: PresenceMedia;
  pointer?: Pointer;
  running?: boolean;
  scroll?: Scroll;
  user: { name: string };
}

export type ClientMessage =
  | { type: "terminal"; result: ExecutionResult }
  | { type: "signal"; to: number; signal: unknown }
  | { type: "terminate" };

export type ServerMessage =
  | { type: "terminal"; result: ExecutionResult }
  | { type: "terminal-history"; results: ExecutionResult[] }
  | { type: "signal"; from: number; signal: unknown }
  | { type: "terminated" };
