/**
 * Code synchronization service for collaborative editing.
 * Features:
 * - Room data management
 * - CRDT update merging and broadcast
 * - Language state sync
 * - State-vector handshake
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { CodeServiceMsg } from "@codex/types/message";
import type { YjsUpdate } from "@codex/types/operation";
import * as Y from "yjs";
import type { Server, Socket } from "@/types";

import { getUserRoom } from "./room-service";
import { getCustomId } from "./user-service";

// Use a single Map for all room data to reduce memory overhead
interface RoomData {
  doc: Y.Doc;
  langId: string;
}

// Core data structure for room management
const roomData = new Map<string, RoomData>();

// Default language ID for HTML
const DEFAULT_LANG_ID = "html";

/** Name of the Y.Text holding the editor contents. Must match the client. */
const CODE_TEXT_KEY = "monaco";

/**
 * Socket.IO hands us binary as a Buffer here and as an ArrayBuffer in the
 * browser. Buffer is already a Uint8Array, so this is a no-op on the server
 * in practice, it exists so a stray ArrayBuffer cannot reach Yjs.
 */
const toUint8Array = (data: YjsUpdate): Uint8Array =>
  data instanceof Uint8Array ? data : new Uint8Array(data);

/**
 * Room existence check - O(1) operation
 */
export const roomExists = (roomID: string): boolean => {
  return roomData.has(roomID);
};

/**
 * Initialize room data if not present
 */
export const initializeRoom = (roomID: string): RoomData => {
  let data = roomData.get(roomID);
  if (!data) {
    data = { doc: new Y.Doc(), langId: DEFAULT_LANG_ID };
    roomData.set(roomID, data);
  }
  return data;
};

/**
 * Get the room's document text with O(1) lookup
 */
export const getCode = (roomID: string): string => {
  return roomData.get(roomID)?.doc.getText(CODE_TEXT_KEY).toString() || "";
};

/**
 * Get language ID with O(1) lookup
 */
export const getLang = (roomID: string): string => {
  return roomData.get(roomID)?.langId || DEFAULT_LANG_ID;
};

/**
 * Set language ID with single operation
 */
export const setLang = (roomID: string, langId: string): void => {
  const data = initializeRoom(roomID);
  data.langId = langId;
};

/**
 * Answer a client's sync handshake.
 *
 * The client sends the state vector describing what it already has; we reply
 * with only the operations it is missing, plus our own state vector so it can
 * push back anything we are missing (edits made before the handshake landed,
 * or while it was disconnected).
 */
export const syncCode = (
  socket: Socket,
  io: Server,
  clientStateVector: YjsUpdate
): void => {
  const customId = getCustomId(socket.id);
  const roomId = getUserRoom(socket);
  if (!(customId && roomId)) {
    return;
  }

  const { doc } = initializeRoom(roomId);

  // A malformed state vector from a client must not take the server down.
  let update: Uint8Array;
  try {
    const bytes = toUint8Array(clientStateVector);
    update = Y.encodeStateAsUpdate(doc, bytes.length > 0 ? bytes : undefined);
  } catch {
    update = Y.encodeStateAsUpdate(doc);
  }

  io.to(socket.id).emit(
    CodeServiceMsg.SYNC_CODE,
    update,
    Y.encodeStateVector(doc)
  );
};

/**
 * Optimized language sync
 */
export const syncLang = (socket: Socket, io: Server): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) {
    return;
  }

  const customId = getCustomId(socket.id);
  if (customId) {
    const langId = getLang(roomID);
    io.to(socket.id).emit(CodeServiceMsg.UPDATE_LANG, langId);
  }
};

/**
 * Optimized language update
 */
export const updateLang = (socket: Socket, langId: string): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) {
    return;
  }

  const customId = getCustomId(socket.id);
  if (customId) {
    setLang(roomID, langId);
    socket.to(roomID).emit(CodeServiceMsg.UPDATE_LANG, langId);
  }
};

/**
 * Merge a client's update into the room document and fan it out.
 *
 * Yjs updates are commutative and idempotent, so ordering across clients does
 * not matter and a replayed update is harmless, which is what makes this
 * safe under Socket.IO's connection state recovery.
 */
export const updateCode = (socket: Socket, update: YjsUpdate): void => {
  const roomID = getUserRoom(socket);
  const customId = getCustomId(socket.id);

  if (!(customId && roomID)) {
    return;
  }

  const bytes = toUint8Array(update);
  const { doc } = initializeRoom(roomID);

  // Merge first: a corrupt update must not be relayed to the other peers.
  try {
    Y.applyUpdate(doc, bytes);
  } catch {
    return;
  }

  socket.to(roomID).emit(CodeServiceMsg.UPDATE_CODE, bytes);
};

/**
 * Clean up room data when a room is deleted
 */
export const deleteRoom = (roomID: string): void => {
  roomData.get(roomID)?.doc.destroy();
  roomData.delete(roomID);
};
