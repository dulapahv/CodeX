import { Server, Socket } from 'socket.io';

import {
  EditServiceMsg,
  RoomServiceMsg,
  UserServiceMsg,
} from '../../../common/types/message';
import * as OTType from '../../../common/types/ot';
import {
  applyOperation,
  DeleteOp,
  InsertOp,
  isDelete,
  isInsert,
  Tdd,
  Tdi,
  TextOperation,
  Tid,
  Tii,
} from '../../../common/transform/ot';

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

export function updateCode(
  socket: Socket,
  roomID: string,
  operation: TextOperation
): void {
  const currentCode = getCode(roomID);
  let updatedCode = currentCode;

  // Apply the operation to the current code
  updatedCode = applyOperation(currentCode, operation);

  // Update the room's code
  roomID_to_Code_Map[roomID] = updatedCode;

  // Broadcast the operation to all clients in the room
  socket.to(roomID).emit(EditServiceMsg.RECEIVE_EDIT, operation, updatedCode);
}