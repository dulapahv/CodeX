/**
 * Typed Socket.IO event interfaces for compile-time safety.
 * Shared between server and client to enforce event contracts.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type {
  CodeServiceMsg,
  PointerServiceMsg,
  RoomServiceMsg,
  ScrollServiceMsg,
  StreamServiceMsg,
} from "./message";
import type { Cursor, EditOp } from "./operation";
import type { Pointer } from "./pointer";
import type { Scroll } from "./scroll";
import type { ExecutionResult } from "./terminal";

/**
 * Events emitted from the client to the server.
 */
export interface ClientToServerEvents {
  ping: () => void;

  // Room
  [RoomServiceMsg.CREATE]: (name: string) => void;
  [RoomServiceMsg.JOIN]: (roomID: string, name: string) => void;
  [RoomServiceMsg.LEAVE]: () => void;
  [RoomServiceMsg.TERMINATE]: () => void;
  [RoomServiceMsg.SYNC_USERS]: () => void;
  [RoomServiceMsg.SYNC_MD]: () => void;
  [RoomServiceMsg.UPDATE_MD]: (note: string) => void;

  // Code
  [CodeServiceMsg.SYNC_CODE]: () => void;
  [CodeServiceMsg.UPDATE_CODE]: (op: EditOp) => void;
  [CodeServiceMsg.UPDATE_CURSOR]: (cursor: Cursor) => void;
  [CodeServiceMsg.SYNC_LANG]: () => void;
  [CodeServiceMsg.UPDATE_LANG]: (langID: string) => void;
  [CodeServiceMsg.EXEC]: (isExecuting: boolean) => void;
  [CodeServiceMsg.UPDATE_TERM]: (data: ExecutionResult) => void;

  // Scroll
  [ScrollServiceMsg.UPDATE_SCROLL]: (scroll: Scroll) => void;

  // Stream (WebRTC)
  [StreamServiceMsg.STREAM_READY]: () => void;
  [StreamServiceMsg.SIGNAL]: (data: {
    signal: unknown;
    targetUserID: string;
  }) => void;
  [StreamServiceMsg.CAMERA_OFF]: () => void;
  [StreamServiceMsg.MIC_STATE]: (micOn: boolean) => void;
  [StreamServiceMsg.SPEAKER_STATE]: (speakersOn: boolean) => void;

  // Pointer
  [PointerServiceMsg.POINTER]: (pointer: Pointer) => void;
}

/**
 * Events emitted from the server to the client.
 */
export interface ServerToClientEvents {
  pong: () => void;

  // Room
  [RoomServiceMsg.CREATE]: (roomID: string, customId: string) => void;
  [RoomServiceMsg.JOIN]: (customId: string) => void;
  [RoomServiceMsg.NOT_FOUND]: (roomID: string) => void;
  [RoomServiceMsg.LEAVE]: (customId: string) => void;
  [RoomServiceMsg.TERMINATE]: () => void;
  [RoomServiceMsg.SYNC_USERS]: (users: Record<string, string>) => void;
  [RoomServiceMsg.UPDATE_MD]: (note: string) => void;

  // Code
  [CodeServiceMsg.SYNC_CODE]: (code: string) => void;
  [CodeServiceMsg.UPDATE_CODE]: (op: EditOp) => void;
  [CodeServiceMsg.UPDATE_CURSOR]: (customId: string, cursor: Cursor) => void;
  [CodeServiceMsg.UPDATE_LANG]: (langID: string) => void;
  [CodeServiceMsg.EXEC]: (isExecuting: boolean) => void;
  [CodeServiceMsg.UPDATE_TERM]: (data: ExecutionResult) => void;

  // Scroll
  [ScrollServiceMsg.UPDATE_SCROLL]: (customId: string, scroll: Scroll) => void;

  // Stream (WebRTC)
  [StreamServiceMsg.USER_READY]: (customId: string) => void;
  [StreamServiceMsg.SIGNAL]: (data: {
    userID: string;
    signal: unknown;
  }) => void;
  [StreamServiceMsg.CAMERA_OFF]: (customId: string) => void;
  [StreamServiceMsg.MIC_STATE]: (data: {
    userID: string;
    micOn: boolean;
  }) => void;
  [StreamServiceMsg.SPEAKER_STATE]: (data: {
    userID: string;
    speakersOn: boolean;
  }) => void;

  // Pointer
  [PointerServiceMsg.POINTER]: (customId: string, pointer: Pointer) => void;
}
