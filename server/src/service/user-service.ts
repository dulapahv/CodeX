import { Socket } from 'socket.io';

import { UserServiceMsg } from '../../../common/types/message';
import { Cursor } from '../../../common/types/operation';
import { getUserRoom } from './room-service';

// Use WeakMap for better memory management of user data
const userID_to_Username_Map = new WeakMap<object, string>();
const userKeys = new Map<string, object>();

// Map to store custom ID to socket.id mappings
const customId_to_SocketId_Map = new Map<string, string>();
const socketId_to_CustomId_Map = new Map<string, string>();

// Set to track used IDs for quick lookup
const usedIds = new Set<string>();

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
export const getUsername = (userID: string): string | undefined => {
  return userID_to_Username_Map.get(getUserKey(userID));
};

/**
 * Connect a user and store their username
 * @param socket Socket instance
 * @param name Username to store
 * @returns Custom ID assigned to the user
 */
export const connect = (socket: Socket, name: string): string => {
  const userKey = getUserKey(socket.id);
  userID_to_Username_Map.set(userKey, name);

  // Assign and return custom ID
  const customId = assignCustomId(socket);
  return customId;
};

/**
 * Disconnect a user and clean up their data
 * @param socket Socket instance
 */
export const disconnect = (socket: Socket): void => {
  userKeys.delete(socket.id);
  // Clean up custom ID mappings
  removeCustomId(socket);

  socket.disconnect();
};

/**
 * Update cursor position for a user and broadcast to room
 * @param socket Socket instance
 * @param cursor Cursor position data
 */
export const updateCursor = (socket: Socket, cursor: Cursor): void => {
  const roomID = getUserRoom(socket);
  const customId = getCustomId(socket.id);

  // Broadcast using custom ID instead of socket.id
  if (customId) {
    socket.to(roomID).emit(UserServiceMsg.CURSOR_RX, customId, cursor);
  }
};

/**
 * Get custom ID for a socket
 * @param socket Socket instance
 * @returns Custom ID if found, undefined otherwise
 */
export const getSocCustomId = (socket: Socket): string | undefined => {
  return getCustomId(socket.id);
};

/**
 * Generates the next available ID in sequence (A, B, C, ..., Z, AA, AB, ...)
 */
const generateNextId = (): string => {
  const generateId = (num: number): string => {
    let id = '';
    while (num >= 0) {
      id = String.fromCharCode(65 + (num % 26)) + id;
      num = Math.floor(num / 26) - 1;
    }
    return id;
  };

  let counter = 0;
  let newId: string;

  // Find the next available ID
  do {
    newId = generateId(counter++);
  } while (usedIds.has(newId));

  return newId;
};

/**
 * Assigns a new custom ID to a socket
 * @param socket Socket instance
 * @returns Assigned custom ID
 */
export const assignCustomId = (socket: Socket): string => {
  const customId = generateNextId();

  // Store mappings
  customId_to_SocketId_Map.set(customId, socket.id);
  socketId_to_CustomId_Map.set(socket.id, customId);
  usedIds.add(customId);

  return customId;
};

/**
 * Removes custom ID mappings for a socket
 * @param socket Socket instance
 */
export const removeCustomId = (socket: Socket): void => {
  const customId = socketId_to_CustomId_Map.get(socket.id);
  if (customId) {
    usedIds.delete(customId);
    customId_to_SocketId_Map.delete(customId);
    socketId_to_CustomId_Map.delete(socket.id);
  }
};

/**
 * Gets the socket ID for a custom ID
 * @param customId Custom user ID
 * @returns Socket ID if found, undefined otherwise
 */
export const getSocketId = (customId: string): string | undefined => {
  return customId_to_SocketId_Map.get(customId);
};

/**
 * Gets the custom ID for a socket ID
 * @param socketId Socket ID
 * @returns Custom ID if found, undefined otherwise
 */
export const getCustomId = (socketId: string): string | undefined => {
  return socketId_to_CustomId_Map.get(socketId);
};

/**
 * Check if a custom ID is in use
 * @param customId Custom ID to check
 * @returns True if the ID is in use, false otherwise
 */
export const isCustomIdInUse = (customId: string): boolean => {
  return usedIds.has(customId);
};
