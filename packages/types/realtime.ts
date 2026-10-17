/**
 * Shared contract between the realtime Worker and the client: the room's
 * Yjs document keys, per-user presence (Yjs awareness), the custom messages
 * sent alongside Yjs, the close codes that end a session, and how the client
 * reaches the Realtime SFU proxy.
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

// Path of the Realtime SFU proxy on the Worker, and the headers that prove
// the caller is connected to the room
export const SFU_PROXY_PATH = "/partytracks";
export const ROOM_ID_HEADER = "X-Room-Id";
export const MEDIA_TOKEN_HEADER = "X-Media-Token";

// A track published to the Realtime SFU
export interface TrackRef {
  sessionId: string;
  trackName: string;
}

export interface PresenceMedia {
  camera: boolean;
  mic: boolean;
  screen: boolean;
  speaker: boolean;
  tracks?: {
    audio?: TrackRef;
    screen?: TrackRef;
    video?: TrackRef;
  };
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
  | { type: "terminate" };

export type ServerMessage =
  | { type: "terminal"; result: ExecutionResult }
  | { type: "terminal-history"; results: ExecutionResult[] }
  // Sent on connect. `token` authorises this connection's calls to the SFU
  // proxy; `enabled` is false when the server has no SFU credentials.
  | { type: "media"; enabled: boolean; token: string }
  | { type: "terminated" };
