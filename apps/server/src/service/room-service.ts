/**
 * Socket service for managing room lifecycle and membership.
 * Features:
 * - Room creation/joining/leaving
 * - User tracking
 * - Room state management
 * - User data sync
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Server, Socket } from 'socket.io';

import { CodeServiceMsg, RoomServiceMsg } from '@codex/types/message';
import type { ExecutionResult } from '@codex/types/terminal';

import { generateRoomID } from '@/utils/generate-room-id';
import { normalizeRoomId } from '@/utils/normalize-room-id';

import * as codeService from './code-service';
import * as userService from './user-service';

// Cache for room users to reduce repeated lookups
const roomUsersCache = new Map<string, Record<string, string>>();

// Maps note to room
const roomNotes = new Map<string, string>();

/**
 * Get the room ID that a user is currently in - O(1) operation
 */
export const getUserRoom = (socket: Socket): string | undefined => {
  // Socket.rooms is a Set, so we convert to array only for room access
  for (const room of socket.rooms) {
    if (room !== socket.id) return room;
  }
  return undefined;
};

/**
 * Creates a new room and joins the socket to it
 */
export const create = async (socket: Socket, name: string): Promise<void> => {
  const customId = userService.connect(socket, name);

  // Generate unique room ID
  let roomID: string;
  do {
    roomID = generateRoomID();
  } while (codeService.roomExists(roomID));

  await socket.join(roomID);

  // Initialize room cache
  roomUsersCache.set(roomID, { [customId]: name });

  socket.emit(RoomServiceMsg.CREATE, roomID, customId);
};

/**
 * Joins an existing room with optimized user management
 */
export const join = async (
  socket: Socket,
  io: Server,
  roomID: string,
  name: string,
): Promise<void> => {
  roomID = normalizeRoomId(roomID);

  if (!io.sockets.adapter.rooms.has(roomID)) {
    socket.emit(RoomServiceMsg.NOT_FOUND, roomID);
    return;
  }

  const customId = userService.connect(socket, name);
  await socket.join(roomID);

  // Update room cache
  const users = roomUsersCache.get(roomID) || {};
  users[customId] = name;
  roomUsersCache.set(roomID, users);

  // Emit events
  socket.emit(RoomServiceMsg.JOIN, customId);
  socket.to(roomID).emit(RoomServiceMsg.SYNC_USERS, users);
};

/**
 * Leaves a room with efficient cleanup
 */
export const leave = async (socket: Socket, io: Server): Promise<void> => {
  try {
    if (!socket || socket.disconnected) return;

    const roomID = getUserRoom(socket);
    if (!roomID) return;

    const customId = userService.getSocCustomId(socket);
    if (!customId) return;

    const users = roomUsersCache.get(roomID);
    if (users) {
      delete users[customId];
      if (Object.keys(users).length === 0) {
        roomUsersCache.delete(roomID);
        codeService.deleteRoom(roomID);
      } else {
        roomUsersCache.set(roomID, users);
      }
    }

    if (io.sockets.adapter.rooms.has(roomID)) {
      socket.to(roomID).emit(RoomServiceMsg.LEAVE, customId);
      socket.to(roomID).emit(RoomServiceMsg.SYNC_USERS, users || {});
    }

    await socket.leave(roomID);

    userService.disconnect(socket);
  } catch {
    return;
  }
};

/**
 * Gets users in a room with caching for better performance
 */
export const getUsersInRoom = (
  socket: Socket,
  io: Server,
  roomID: string = getUserRoom(socket),
): Record<string, string> => {
  // Return empty object if no room
  if (!roomID) return {};

  // Check cache first
  let users = roomUsersCache.get(roomID);

  // If not in cache, rebuild it
  if (!users) {
    const room = io.sockets.adapter.rooms.get(roomID);
    if (!room) return {};

    users = {};
    for (const socketId of room) {
      const username = userService.getUsername(socketId);
      const customId = userService.getSocCustomId(
        io.sockets.sockets.get(socketId),
      );
      if (username && customId) {
        users[customId] = username;
      }
    }

    // Update cache
    roomUsersCache.set(roomID, users);
  }

  // Update client
  io.to(socket.id).emit(RoomServiceMsg.SYNC_USERS, users);
  return users;
};

/**
 * Clean up room cache when server restarts or room is deleted
 * Should be called when appropriate
 */
export const cleanupRoomCache = (roomID: string): void => {
  roomUsersCache.delete(roomID);
};

/**
 * Get the note for a room
 */
export const syncNote = (socket: Socket, io: Server): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

  const note = roomNotes.get(roomID) || '';
  io.to(socket.id).emit(RoomServiceMsg.UPDATE_MD, note);
};

/**
 * Update the note for a room
 */
export const updateNote = (socket: Socket, note: string): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

  socket.to(roomID).emit(RoomServiceMsg.UPDATE_MD, note);
  roomNotes.set(roomID, note);
};

export const updateExecuting = (socket: Socket, executing: boolean): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

  socket.to(roomID).emit(CodeServiceMsg.EXEC, executing);
};

/**
 * Update the terminal for a room
 */
export const updateTerminal = (socket: Socket, data: ExecutionResult): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

  socket.to(roomID).emit(CodeServiceMsg.UPDATE_TERM, data);
};
