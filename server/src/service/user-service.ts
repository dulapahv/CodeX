import { Server, Socket } from 'socket.io';

import { UserServiceMsg } from '../../../common/types/message';
import { Cursor } from '../../../common/types/operation';

// Use WeakMap for better memory management of user data
const userID_to_Username_Map = new WeakMap<object, string>();
const userKeys = new Map<string, object>();

/**
 * Get or create user key for WeakMap storage
 * @param userID User identifier (socket.id)
 * @returns User key object
 */
function getUserKey(userID: string): object {
  let key = userKeys.get(userID);
  if (!key) {
    key = { id: userID };
    userKeys.set(userID, key);
  }
  return key;
}

/**
 * Retrieve username for a given user ID with O(1) lookup
 * @param userID User identifier
 * @returns Username associated with the user ID
 */
export function getUsername(userID: string): string | undefined {
  return userID_to_Username_Map.get(getUserKey(userID));
}

/**
 * Connect a user and store their username
 * @param socket Socket instance
 * @param name Username to store
 */
export function connect(socket: Socket, name: string): void {
  const userKey = getUserKey(socket.id);
  userID_to_Username_Map.set(userKey, name);
}

/**
 * Disconnect a user and clean up their data
 * @param socket Socket instance
 */
export function disconnect(socket: Socket): void {
  userKeys.delete(socket.id);
  // WeakMap will automatically garbage collect the entry
}

/**
 * Update cursor position for a user and broadcast to room
 * @param socket Socket instance
 * @param roomID Room identifier
 * @param cursor Cursor position data
 */
export function updateCursor(
  socket: Socket,
  roomID: string,
  cursor: Cursor
): void {
  const name = getUsername(socket.id);
  if (!name) return;

  // Update cursor for all users in the room except the sender
  socket.to(roomID).emit(UserServiceMsg.CURSOR_RX, name, cursor);
}
