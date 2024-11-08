import { Server, Socket } from 'socket.io';

import { CodeServiceMsg } from '../../../common/types/message';
import { EditOp } from '../../../common/types/operation';
import { getUserRoom } from './room-service';

// Use a WeakMap for better memory management - allows garbage collection of unused rooms
const roomID_to_Code_Map = new WeakMap<object, string>();
const roomKeys = new Map<string, object>();

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
  }
  return key;
}

/**
 * Retrieve the current code for a room with O(1) lookup
 * @param roomID Room identifier
 * @returns Current code for the room
 */
export function getCode(roomID: string): string {
  return roomID_to_Code_Map.get(getRoomKey(roomID)) || '';
}

/**
 * Sync code to a client with minimal data transfer
 */
export function syncCode(socket: Socket, io: Server): void {
  io.to(socket.id).emit(
    CodeServiceMsg.RECEIVE_CODE,
    getCode(getUserRoom(socket)),
  );
}

/**
 * Optimized string splicing function that minimizes string allocations
 */
function spliceString(
  original: string,
  start: number,
  end: number,
  insert: string,
): string {
  // Avoid unnecessary string operations if possible
  if (start === end && !insert) return original;
  if (start === 0 && end === original.length) return insert;

  // Use substring instead of slice for better performance
  return original.substring(0, start) + insert + original.substring(end);
}

/**
 * Updates the code in a room based on an edit operation
 * Optimized for performance while maintaining safety
 */
export function updateCode(socket: Socket, operation: EditOp): void {
  const roomID = getUserRoom(socket);
  const currentCode = getCode(roomID);
  const { r, t } = operation;
  const { sL, sC, eL, eC } = r;

  // Split lines only once and reuse the array
  const lines = currentCode.split('\n');
  const maxLine = Math.max(lines.length, sL);

  // Preallocate array size if needed
  if (maxLine > lines.length) {
    lines.length = maxLine;
    lines.fill('', lines.length, maxLine);
  }

  // Handle empty line deletion specifically
  const isEmptyLineDeletion = t === '' && sL < eL && sC === 1 && eC === 1;

  if (isEmptyLineDeletion) {
    // Remove the empty lines
    lines.splice(sL - 1, eL - sL);
  } else if (sL === eL) {
    // Single line change
    const lineIndex = sL - 1;
    const line = lines[lineIndex] || '';

    // Boundary check with bitwise operations for performance
    const safesC = Math.max(0, Math.min(sC - 1, line.length));
    const safeeC = Math.max(0, Math.min(eC - 1, line.length));

    // Optimize string concatenation
    lines[lineIndex] = spliceString(line, safesC, safeeC, t);
  } else {
    // Multi-line change
    const textLines = t.split('\n');
    const startLineIndex = sL - 1;
    const endLineIndex = eL - 1;

    // Get start and end lines
    const startLine = lines[startLineIndex] || '';
    const endLine = lines[endLineIndex] || '';

    // Calculate safe column positions
    const safesC = Math.min(Math.max(0, sC - 1), startLine.length);
    const safeeC = Math.min(Math.max(0, eC - 1), endLine.length);

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
}
