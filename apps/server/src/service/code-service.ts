/**
 * Code synchronization service for collaborative editing.
 * Features:
 * - Room data management
 * - Code update handling
 * - Language state sync
 * - Real-time broadcast
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { CodeServiceMsg } from "@codex/types/message";
import type { EditOp } from "@codex/types/operation";
import type { Server, Socket } from "@/types";

import { getUserRoom } from "./room-service";
import { getCustomId } from "./user-service";

// Use a single Map for all room data to reduce memory overhead
interface RoomData {
  code: string;
  langId: string;
}

// Core data structure for room management
const roomData = new Map<string, RoomData>();

// Default language ID for HTML
const DEFAULT_LANG_ID = "html";

/**
 * Room existence check - O(1) operation
 */
export const roomExists = (roomID: string): boolean => {
  return roomData.has(roomID);
};

/**
 * Initialize room data if not present
 */
function initializeRoom(roomID: string): RoomData {
  let data = roomData.get(roomID);
  if (!data) {
    data = { code: "", langId: DEFAULT_LANG_ID };
    roomData.set(roomID, data);
  }
  return data;
}

/**
 * Get code with O(1) lookup
 */
export const getCode = (roomID: string): string => {
  return roomData.get(roomID)?.code || "";
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
 * Optimized code sync
 */
export const syncCode = (socket: Socket, io: Server): void => {
  const customId = getCustomId(socket.id);
  const roomId = getUserRoom(socket);
  if (customId && roomId) {
    const code = getCode(roomId);
    io.to(socket.id).emit(CodeServiceMsg.SYNC_CODE, code);
  }
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
 * Convert a 1-indexed (line, column) position to a 0-indexed character offset.
 * Matches Monaco Editor's coordinate system where lines and columns start at 1.
 */
const positionToOffset = (
  code: string,
  line: number,
  column: number
): number => {
  let offset = 0;
  let currentLine = 1;

  while (currentLine < line) {
    const nextNewline = code.indexOf("\n", offset);
    if (nextNewline === -1) {
      offset = code.length;
      break;
    }
    offset = nextNewline + 1;
    currentLine++;
  }

  return Math.min(offset + column - 1, code.length);
};

/**
 * Apply an edit operation to the server-side document using offset-based
 * string replacement. This mirrors exactly what Monaco's pushEditOperations
 * does internally: replace the text in range [start, end) with new text.
 */
export const updateCode = (socket: Socket, operation: EditOp): void => {
  const roomID = getUserRoom(socket);
  const customId = getCustomId(socket.id);

  if (!(customId && roomID)) {
    return;
  }

  socket.to(roomID).emit(CodeServiceMsg.UPDATE_CODE, operation);

  const currentCode = getCode(roomID);
  const [txt, startLnNum, startCol, endLnNum, endCol] = operation;

  const startOffset = positionToOffset(currentCode, startLnNum, startCol);
  const endOffset = positionToOffset(currentCode, endLnNum, endCol);

  const updatedCode =
    currentCode.substring(0, startOffset) +
    txt +
    currentCode.substring(endOffset);

  const data = initializeRoom(roomID);
  data.code = updatedCode;
};

/**
 * Clean up room data when a room is deleted
 */
export const deleteRoom = (roomID: string): void => {
  roomData.delete(roomID);
};
