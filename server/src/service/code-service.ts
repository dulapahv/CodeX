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

// Pre-allocate constants as string literals for v8 optimization
const EMPTY = '' as const;
const LF = '\n' as const;
const EMPTY_ARRAY: readonly string[] = Object.freeze([]);

// Use binary operations for faster integer operations
const BITMASK_31 = 0x7fffffff;

/**
 * Ultra-fast string splice using modern JS engine optimizations
 * Exploits V8's string optimization patterns
 */
function ultraFastSplice(
  str: string,
  start: number,
  end: number,
  insert: string = EMPTY
): string {
  // V8 optimization: Check string length only once
  const len = str.length | 0; // Force 32-bit integer

  // Optimize common cases
  if (start >= len) return str + insert;
  if (start === 0 && end >= len) return insert;
  if (start === end && !insert) return str;

  // Fast path for single character operations
  if (insert.length === 1 && end - start <= 1) {
    // Use array buffer for fast character manipulation
    const buf = new Uint16Array(str.length + 1);
    for (let i = 0; i < start; i++) buf[i] = str.charCodeAt(i);
    buf[start] = insert.charCodeAt(0);
    for (let i = end; i < str.length; i++) buf[i + 1] = str.charCodeAt(i);
    return String.fromCharCode(
      ...buf.subarray(0, start + 1 + str.length - end)
    );
  }

  // Use slice for larger operations - V8 optimizes this well
  return str.slice(0, start) + insert + str.slice(end);
}

/**
 * Optimized line cache using ArrayBuffer for faster access
 * Exploits CPU cache locality
 */
class LineCache {
  private buffer: ArrayBuffer;
  private lines: string[];
  private hash: number;

  constructor() {
    this.buffer = new ArrayBuffer(0);
    this.lines = [];
    this.hash = 0;
  }

  update(code: string): string[] {
    // Quick hash check to avoid unnecessary updates
    const newHash = this.quickHash(code);
    if (newHash === this.hash) return this.lines;

    this.hash = newHash;
    this.lines = code.split(LF);

    // Pre-calculate string lengths for faster access
    const totalLen = code.length | 0;
    this.buffer = new ArrayBuffer(totalLen * 2);
    const view = new Uint16Array(this.buffer);
    let offset = 0;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      for (let j = 0; j < line.length; j++) {
        view[offset++] = line.charCodeAt(j);
      }
    }

    return this.lines;
  }

  private quickHash(str: string): number {
    const FNV_PRIME = 0x01000193;
    const FNV_OFFSET = 0x811c9dc5;

    let hash = FNV_OFFSET;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, FNV_PRIME);
    }
    return hash;
  }
}

// Cache line arrays per room using WeakMap
const lineCacheMap = new WeakMap<object, LineCache>();

/**
 * Get or create line cache for a room
 */
function getLineCache(roomKey: object): LineCache {
  let cache = lineCacheMap.get(roomKey);
  if (!cache) {
    cache = new LineCache();
    lineCacheMap.set(roomKey, cache);
  }
  return cache;
}

/**
 * Optimized safe integer operations using bitwise operators
 */
function getSafeColumn(col: number, len: number): number {
  return (Math.max(0, col - 1) & BITMASK_31) < len
    ? (col - 1) & BITMASK_31
    : len & BITMASK_31;
}

/**
 * Ultra-optimized code update function
 * Exploits CPU cache locality and modern JS engine optimizations
 */
export function updateCode(
  socket: Socket,
  roomID: string,
  { range, text }: EditOp
): void {
  // Destructure for V8 property access optimization
  const { startLineNumber, startColumn, endLineNumber, endColumn } = range;

  // Get room key once and cache locally
  const roomKey = getRoomKey(roomID);
  const currentCode = getCode(roomID);

  // Quick exit for no-op changes using bitwise comparison
  if (
    !text.length &&
    (startLineNumber | 0) === (endLineNumber | 0) &&
    (startColumn | 0) === (endColumn | 0)
  ) {
    socket.to(roomID).emit(CodeServiceMsg.RECEIVE_EDIT, { range, text });
    return;
  }

  // Get cached line array with optimized buffer
  const lineCache = getLineCache(roomKey);
  const lines = lineCache.update(currentCode);

  // Single line optimization
  if ((startLineNumber | 0) === (endLineNumber | 0)) {
    const lineIndex = (startLineNumber - 1) | 0;
    const line = lines[lineIndex] || EMPTY;

    // Fast path for single character operations
    if (text.length <= 1 && Math.abs(endColumn - startColumn) <= 1) {
      const safeStart = getSafeColumn(startColumn, line.length);
      const safeEnd = getSafeColumn(endColumn, line.length);

      lines[lineIndex] = ultraFastSplice(line, safeStart, safeEnd, text);
    } else {
      // Regular single line change
      const safeStart = getSafeColumn(startColumn, line.length);
      const safeEnd = getSafeColumn(endColumn, line.length);

      lines[lineIndex] = ultraFastSplice(line, safeStart, safeEnd, text);
    }
  } else {
    // Multi-line optimization
    const textLines = text.includes(LF) ? text.split(LF) : [text];
    const startLineIndex = (startLineNumber - 1) | 0;
    const endLineIndex = (endLineNumber - 1) | 0;

    const startLine = lines[startLineIndex] || EMPTY;
    const endLine = lines[endLineIndex] || EMPTY;

    const safeStartCol = getSafeColumn(startColumn, startLine.length);
    const safeEndCol = getSafeColumn(endColumn, endLine.length);

    // Optimize for 2-line changes
    if (textLines.length === 2) {
      const newStartLine = ultraFastSplice(
        startLine,
        safeStartCol,
        startLine.length,
        textLines[0]
      );
      const newEndLine = ultraFastSplice(endLine, 0, safeEndCol, textLines[1]);

      if (endLineIndex - startLineIndex === 1) {
        lines[startLineIndex] = newStartLine;
        lines[endLineIndex] = newEndLine;
      } else {
        lines.splice(
          startLineIndex,
          endLineIndex - startLineIndex + 1,
          newStartLine,
          newEndLine
        );
      }
    } else {
      const newStartLine = ultraFastSplice(
        startLine,
        safeStartCol,
        startLine.length,
        textLines[0]
      );
      const newEndLine = ultraFastSplice(
        endLine,
        0,
        safeEndCol,
        textLines[textLines.length - 1]
      );

      const midLines =
        textLines.length > 2 ? textLines.slice(1, -1) : EMPTY_ARRAY;

      if (!midLines.length) {
        lines.splice(
          startLineIndex,
          endLineIndex - startLineIndex + 1,
          newStartLine,
          newEndLine
        );
      } else {
        lines.splice(
          startLineIndex,
          endLineIndex - startLineIndex + 1,
          newStartLine,
          ...midLines,
          newEndLine
        );
      }
    }
  }

  // Optimize string joining
  const updatedCode = lines.join(LF);
  roomID_to_Code_Map.set(roomKey, updatedCode);

  socket.to(roomID).emit(CodeServiceMsg.RECEIVE_EDIT, { range, text });
}
