import { Server, Socket } from 'socket.io';

import {
  CodeServiceMsg,
  RoomServiceMsg,
  UserServiceMsg,
} from '../../../common/types/message';
import { ChangeOp } from '../../../common/types/ot';

// Import transformation functions and types

// In-memory map to store the current document content of each room.
const roomID_to_Code_Map: { [key: string]: string } = {};

/**
 * Retrieve the current code for a room.
 * @param roomID The room identifier.
 * @returns The current code for the room.
 */
export function getCode(roomID: string): string {
  return roomID_to_Code_Map[roomID] || '';
}

export function syncCode(socket: Socket, io: Server, roomID: string): void {
  const code = getCode(roomID);
  io.to(socket.id).emit(CodeServiceMsg.RECEIVE_CODE, code);
}

export function updateCode(
  socket: Socket,
  roomID: string,
  operation: ChangeOp
): void {
  const currentCode = getCode(roomID);
  let updatedCode = currentCode;

  // Apply the operation to the current code
  const lines = currentCode.split('\n');
  const { range, text } = operation;
  const { startLineNumber, startColumn, endLineNumber, endColumn } = range;

  // Handle multi-line changes
  if (startLineNumber === endLineNumber) {
    // Single line change
    const line = lines[startLineNumber - 1];
    const newLine =
      line.substring(0, startColumn - 1) + text + line.substring(endColumn - 1);
    lines[startLineNumber - 1] = newLine;
  } else {
    // Multi-line change
    const startLine = lines[startLineNumber - 1];
    const endLine = lines[endLineNumber - 1];
    const newStartLine =
      startLine.substring(0, startColumn - 1) + text.split('\n')[0];
    const newEndLine =
      text.split('\n').pop() + endLine.substring(endColumn - 1);

    // Remove the old lines and insert the new ones
    lines.splice(
      startLineNumber - 1,
      endLineNumber - startLineNumber + 1,
      newStartLine,
      ...text.split('\n').slice(1, -1),
      newEndLine
    );
  }

  updatedCode = lines.join('\n');

  // Update the room's code
  roomID_to_Code_Map[roomID] = updatedCode;

  // Broadcast the operation to all clients in the room
  socket.to(roomID).emit(CodeServiceMsg.RECEIVE_EDIT, operation, updatedCode);
}
