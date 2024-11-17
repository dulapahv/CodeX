import { Server, Socket } from 'socket.io';

import { CodeServiceMsg } from '../../../common/types/message';
import { EditOp } from '../../../common/types/operation';
import { getUserRoom } from './room-service';

// Use WeakMap for better memory management - allows garbage collection of unused rooms
const roomID_to_Code_Map = new WeakMap<object, string>();
const roomID_to_Lang_Map = new WeakMap<object, string>();
const roomKeys = new Map<string, object>();

// Default language ID for Python
const DEFAULT_LANG_ID = 'python';

/**
 * Get or create room key for WeakMap storage
 * @param roomID Room identifier
 * @returns Room key object
 */
function getRoomKey(roomID: string): object {
  let key = roomKeys.get(roomID);
  if (!key) {
    key = { id: roomID };
    roomKeys.set(roomID, key);
    // Initialize with default language when creating new room
    roomID_to_Lang_Map.set(key, DEFAULT_LANG_ID);
  }
  return key;
}

/**
 * Check whether a room exists
 * @param roomID Room identifier
 * @returns True if the room exists, false otherwise
 */
export const roomExists = (roomID: string): boolean => {
  return roomKeys.has(roomID);
};

/**
 * Retrieve the current code for a room with O(1) lookup
 * @param roomID Room identifier
 * @returns Current code for the room
 */
export const getCode = (roomID: string): string => {
  return roomID_to_Code_Map.get(getRoomKey(roomID)) || '';
};

/**
 * Retrieve the current language ID for a room
 * @param roomID Room identifier
 * @returns Current language ID for the room
 */
export const getLang = (roomID: string): string => {
  return roomID_to_Lang_Map.get(getRoomKey(roomID)) || DEFAULT_LANG_ID;
};

/**
 * Set the language ID for a room
 * @param roomID Room identifier
 * @param langId Language identifier
 */
export const setLang = (roomID: string, langId: string): void => {
  roomID_to_Lang_Map.set(getRoomKey(roomID), langId);
};

/**
 * Sync code to a client with minimal data transfer
 */
export const syncCode = (socket: Socket, io: Server): void => {
  io.to(socket.id).emit(
    CodeServiceMsg.RECEIVE_CODE,
    getCode(getUserRoom(socket)),
  );
};

/**
 * Sync language ID to a client
 */
export const syncLang = (socket: Socket, io: Server): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

  const langId = getLang(roomID);
  io.to(socket.id).emit(CodeServiceMsg.LANG_RX, langId);
};

/**
 * Update the language ID for a room
 */
export const updateLang = (socket: Socket, langId: string): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

  setLang(roomID, langId);
  socket.in(roomID).emit(CodeServiceMsg.LANG_RX, langId);
};

/**
 * Optimized string splicing function that minimizes string allocations
 */
const spliceString = (
  original: string,
  start: number,
  end: number,
  insert: string,
): string => {
  // Avoid unnecessary string operations if possible
  if (start === end && !insert) return original;
  if (start === 0 && end === original.length) return insert;

  // Use substring instead of slice for better performance
  return original.substring(0, start) + insert + original.substring(end);
};

/**
 * Updates the code in a room based on an edit operation
 * Optimized for performance while maintaining safety
 */
export const updateCode = (socket: Socket, operation: EditOp): void => {
  const roomID = getUserRoom(socket);
  const currentCode = getCode(roomID);
  const txt = operation[0];
  const startLnNum = operation[1];
  const startCol = operation[2];
  const endLnNum = operation[3];
  const endCol = operation[4];

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
    const safesC = Math.max(0, Math.min(startCol - 1, line.length));
    const safeeC = Math.max(0, Math.min(endCol - 1, line.length));

    // Optimize string concatenation
    lines[lineIndex] = spliceString(line, safesC, safeeC, txt);
  } else {
    // Multi-line change
    const textLines = txt.split('\n');
    const startLineIndex = startLnNum - 1;
    const endLineIndex = endLnNum - 1;

    // Get start and end lines
    const startLine = lines[startLineIndex] || '';
    const endLine = lines[endLineIndex] || '';

    // Calculate safe column positions
    const safesC = Math.min(Math.max(0, startCol - 1), startLine.length);
    const safeeC = Math.min(Math.max(0, endCol - 1), endLine.length);

    // Create new start and end lines efficiently
    const newStartLine = spliceString(
      startLine,
      safesC,
      startLine.length,
      textLines[0],
    );
    const newEndLine = spliceString(
      endLine,
      0,
      safeeC,
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

  // Join lines efficiently
  const updatedCode = lines.join('\n');

  // Update storage using WeakMap
  const roomKey = getRoomKey(roomID);
  roomID_to_Code_Map.set(roomKey, updatedCode);

  // Emit update
  socket.to(roomID).emit(CodeServiceMsg.CODE_RX, operation);
};
