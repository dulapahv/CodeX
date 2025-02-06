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

import type { Server, Socket } from 'socket.io';

import { CodeServiceMsg } from '@codex/types/message';
import type { EditOp } from '@codex/types/operation';

import { getUserRoom } from './room-service';
import { getCustomId } from './user-service';

// Use a single Map for all room data to reduce memory overhead
type RoomData = {
  code: string;
  langId: string;
};

// Core data structure for room management
const roomData = new Map<string, RoomData>();

// Default language ID for HTML
const DEFAULT_LANG_ID = 'html';

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
    data = { code: '', langId: DEFAULT_LANG_ID };
    roomData.set(roomID, data);
  }
  return data;
}

/**
 * Get code with O(1) lookup
 */
export const getCode = (roomID: string): string => {
  return roomData.get(roomID)?.code || '';
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
  if (customId) {
    const code = getCode(getUserRoom(socket));
    io.to(socket.id).emit(CodeServiceMsg.SYNC_CODE, code);
  }
};

/**
 * Optimized language sync
 */
export const syncLang = (socket: Socket, io: Server): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

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
  if (!roomID) return;

  const customId = getCustomId(socket.id);
  if (customId) {
    setLang(roomID, langId);
    socket.to(roomID).emit(CodeServiceMsg.UPDATE_LANG, langId);
  }
};

/**
 * Original optimized string splicing function
 */
const spliceString = (
  original: string,
  start: number,
  end: number,
  insert: string,
): string => {
  if (start === end && !insert) return original;
  if (start === 0 && end === original.length) return insert;
  return original.substring(0, start) + insert + original.substring(end);
};

/**
 * Optimized code update with existing string manipulation logic
 */
export const updateCode = (socket: Socket, operation: EditOp): void => {
  const roomID = getUserRoom(socket);
  const customId = getCustomId(socket.id);

  if (!customId || !roomID) return;

  // Emit update with custom ID
  socket.to(roomID).emit(CodeServiceMsg.UPDATE_CODE, operation);

  const currentCode = getCode(roomID);
  const [txt, startLnNum, startCol, endLnNum, endCol] = operation;

  // Split lines only once and reuse the array
  const lines = currentCode.split('\n');
  const maxLine = Math.max(lines.length, startLnNum);

  // Preallocate array size if needed
  if (maxLine > lines.length) {
    lines.length = maxLine;
    lines.fill('', lines.length, maxLine);
  }

  // Handle empty line deletion specifically
  const isEmptyLineDeletion =
    txt === '' && startLnNum < endLnNum && startCol === 1 && endCol === 1;

  if (isEmptyLineDeletion) {
    // Remove the empty lines
    lines.splice(startLnNum - 1, endLnNum - startLnNum);
  } else if (startLnNum === endLnNum) {
    // Single line change
    const lineIndex = startLnNum - 1;
    const line = lines[lineIndex] || '';

    // Boundary check with bitwise operations for performance
    const safeStartCol = Math.max(0, Math.min(startCol - 1, line.length));
    const safeEndCol = Math.max(0, Math.min(endCol - 1, line.length));

    // Optimize string concatenation
    lines[lineIndex] = spliceString(line, safeStartCol, safeEndCol, txt);
  } else {
    // Multi-line change
    const textLines = txt.split('\n');
    const startLineIndex = startLnNum - 1;
    const endLineIndex = endLnNum - 1;

    // Get start and end lines
    const startLine = lines[startLineIndex] || '';
    const endLine = lines[endLineIndex] || '';

    // Calculate safe column positions
    const safeStartCol = Math.min(Math.max(0, startCol - 1), startLine.length);
    const safeEndCol = Math.min(Math.max(0, endCol - 1), endLine.length);

    // Create new start and end lines efficiently
    const newStartLine = spliceString(
      startLine,
      safeStartCol,
      startLine.length,
      textLines[0],
    );
    const newEndLine = spliceString(
      endLine,
      0,
      safeEndCol,
      textLines[textLines.length - 1],
    );

    // Optimize array operations by calculating exact size needed
    const newLinesCount = textLines.length;
    const removedLinesCount = endLineIndex - startLineIndex + 1;
    const sizeChange = newLinesCount - removedLinesCount;

    // Pre-allocate array if growing
    if (sizeChange > 0) {
      lines.length += sizeChange;
    }

    // Efficient array manipulation
    if (newLinesCount === 2) {
      // Optimize common case of 2-line change
      lines[startLineIndex] = newStartLine;
      lines[startLineIndex + 1] = newEndLine;
      if (removedLinesCount > 2) {
        lines.splice(startLineIndex + 2, removedLinesCount - 2);
      }
    } else {
      // General case
      const newLines = [newStartLine, ...textLines.slice(1, -1), newEndLine];
      lines.splice(startLineIndex, removedLinesCount, ...newLines);
    }
  }

  // Join lines and update storage
  const updatedCode = lines.join('\n');
  const data = initializeRoom(roomID);
  data.code = updatedCode;
};

/**
 * Clean up room data when a room is deleted
 */
export const deleteRoom = (roomID: string): void => {
  roomData.delete(roomID);
};
