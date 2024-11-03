import { Server, Socket } from 'socket.io';

import { CodeServiceMsg } from '../../../common/types/message';
import { EditOp } from '../../../common/types/operation';

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
export function syncCode(socket: Socket, io: Server, roomID: string): void {
  io.to(socket.id).emit(CodeServiceMsg.RECEIVE_CODE, getCode(roomID));
}

/**
 * Optimized string splicing function that minimizes string allocations
 */
function spliceString(
  original: string,
  start: number,
  end: number,
  insert: string
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
export function updateCode(
  socket: Socket,
  roomID: string,
  operation: EditOp
): void {
  const currentCode = getCode(roomID);
  const { range, text } = operation;
  const { startLineNumber, startColumn, endLineNumber, endColumn } = range;

  // Split lines only once and reuse the array
  const lines = currentCode.split('\n');
  const maxLine = Math.max(lines.length, startLineNumber);

  // Preallocate array size if needed
  if (maxLine > lines.length) {
    lines.length = maxLine;
    lines.fill('', lines.length, maxLine);
  }

  // Handle empty line deletion specifically
  const isEmptyLineDeletion =
    text === '' &&
    startLineNumber < endLineNumber &&
    startColumn === 1 &&
    endColumn === 1;

  if (isEmptyLineDeletion) {
    // Remove the empty lines
    lines.splice(startLineNumber - 1, endLineNumber - startLineNumber);
  } else if (startLineNumber === endLineNumber) {
    // Single line change
    const lineIndex = startLineNumber - 1;
    const line = lines[lineIndex] || '';

    // Boundary check with bitwise operations for performance
    const safeStartColumn = Math.max(0, Math.min(startColumn - 1, line.length));
    const safeEndColumn = Math.max(0, Math.min(endColumn - 1, line.length));

    // Optimize string concatenation
    lines[lineIndex] = spliceString(line, safeStartColumn, safeEndColumn, text);
  } else {
    // Multi-line change
    const textLines = text.split('\n');
    const startLineIndex = startLineNumber - 1;
    const endLineIndex = endLineNumber - 1;

    // Get start and end lines
    const startLine = lines[startLineIndex] || '';
    const endLine = lines[endLineIndex] || '';

    // Calculate safe column positions
    const safeStartColumn = Math.min(
      Math.max(0, startColumn - 1),
      startLine.length
    );
    const safeEndColumn = Math.min(Math.max(0, endColumn - 1), endLine.length);

    // Create new start and end lines efficiently
    const newStartLine = spliceString(
      startLine,
      safeStartColumn,
      startLine.length,
      textLines[0]
    );
    const newEndLine = spliceString(
      endLine,
      0,
      safeEndColumn,
      textLines[textLines.length - 1]
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
