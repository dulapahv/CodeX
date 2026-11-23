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
  // The first file's text, kept here so rooms from before multiple files
  // keep their code
  code: "code",
  files: "files",
  meta: "meta",
  notes: "notepad",
} as const;

// Markdown notes from before the notepad moved to Lexical, read once to seed it
export const LEGACY_NOTES_DOC = "notes";

export const META_LANGUAGE = "language";
// Set once a room's single file has become its first file
export const META_HAS_FILES = "hasFiles";
// The latest change someone made to the files, shown to everyone else
export const META_ACTIVITY = "activity";
export const DEFAULT_LANGUAGE = "python";

export const MAX_NAME_LENGTH = 64;
export const TERMINAL_HISTORY_LIMIT = 50;

export const CloseCode = {
  // The host removed this person, or their browser, from the room
  REMOVED: 4403,
  // The same seat connected again, as from a reload or a duplicated tab
  REPLACED: 4409,
  ROOM_LOCKED: 4423,
  ROOM_NOT_FOUND: 4404,
  TERMINATED: 4001,
} as const;

// Path of the Realtime SFU proxy on the Worker, and the headers that prove
// the caller is connected to the room
export const SFU_PROXY_PATH = "/partytracks";
export const ROOM_ID_HEADER = "X-Room-Id";
export const MEDIA_TOKEN_HEADER = "X-Media-Token";

// A client connects with its Yjs client ID, and the room takes presence from
// that connection for that ID only
export const CLIENT_ID_PARAM = "clientId";

// This tab's seat in the room. The host gets theirs when creating the room
// and everyone else when they first join, and it keeps their role and lets
// them back into a locked room.
export const ROOM_TOKEN_PARAM = "token";
// The host's token, kept by the browser that created the room. It makes a
// tab the host only while no other tab is.
export const HOST_KEY_PARAM = "hostKey";
// A random ID for the browser, so the host can keep someone removed out
export const BROWSER_ID_PARAM = "browser";

// The host creates the room and decides who else may edit
export type RoomRole = "editor" | "host" | "viewer";

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

// The notepad caret, in the shape Lexical's Yjs binding reads and writes
export interface NotepadPresence {
  anchorPos: unknown;
  awarenessData: object;
  color: string;
  focusing: boolean;
  focusPos: unknown;
  name: string;
}

export interface Presence {
  cursor?: Cursor;
  // The file this person has open
  file?: string;
  media: PresenceMedia;
  notepad?: NotepadPresence;
  pointer?: Pointer;
  running?: boolean;
  scroll?: Scroll;
  user: { name: string };
}

export type ClientMessage =
  | { type: "terminal"; result: ExecutionResult }
  | { type: "terminate" }
  // The rest are the host's alone
  | { type: "lock"; locked: boolean }
  // Hands the host's seat to someone else, and the host becomes an editor
  | { type: "make-host"; clientId: number }
  | { type: "remove"; clientId: number }
  | { type: "set-role"; clientId: number; role: "editor" | "viewer" };

export type ServerMessage =
  | { type: "terminal"; result: ExecutionResult }
  | { type: "terminal-history"; results: ExecutionResult[] }
  // Sent to everyone whenever it changes. People are named by Yjs client ID,
  // and anyone who isn't a host or a viewer can edit.
  | { type: "access"; hostIds: number[]; locked: boolean; viewerIds: number[] }
  // This person's room token, to connect with from now on
  | { type: "token"; token: string }
  // Sent on connect. `token` authorises this connection's calls to the SFU
  // proxy; `enabled` is false when the server has no SFU credentials.
  | { type: "media"; enabled: boolean; token: string }
  | { type: "terminated" };
