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

import { CodeServiceMsg, RoomServiceMsg } from "@codex/types/message";
import type { ExecutionResult } from "@codex/types/terminal";
import type { Server, Socket } from "@/types";

import { generateRoomID } from "@/utils/generate-room-id";
import { normalizeRoomId } from "@/utils/normalize-room-id";

import * as codeService from "./code-service";
import * as userService from "./user-service";

// Cache for room users to reduce repeated lookups
const roomUsersCache = new Map<string, Record<string, string>>();

// Maps note to room
const roomNotes = new Map<string, string>();

// Grace period timers for empty rooms - keeps room data alive after last user leaves
const roomGraceTimers = new Map<string, ReturnType<typeof setTimeout>>();

// How long to keep an empty room alive before deleting its data (5 minutes)
const ROOM_GRACE_PERIOD_MS = 5 * 60 * 1000;

/**
 * Start a grace period for an empty room.
 * Room data (code, notes) is preserved during the grace period.
 * If no one rejoins, the room is deleted when the timer expires.
 */
const startGracePeriod = (roomID: string): void => {
  // Clear any existing timer for this room
  const existing = roomGraceTimers.get(roomID);
  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(() => {
    roomUsersCache.delete(roomID);
    codeService.deleteRoom(roomID);
    roomNotes.delete(roomID);
    roomGraceTimers.delete(roomID);
  }, ROOM_GRACE_PERIOD_MS);

  roomGraceTimers.set(roomID, timer);
};

/**
 * Cancel the grace period for a room (e.g. when a user rejoins).
 */
const cancelGracePeriod = (roomID: string): void => {
  const timer = roomGraceTimers.get(roomID);
  if (timer) {
    clearTimeout(timer);
    roomGraceTimers.delete(roomID);
  }
};

/**
 * Get the room ID that a user is currently in - O(1) operation
 */
export const getUserRoom = (socket: Socket): string | undefined => {
  // Socket.rooms is a Set, so we convert to array only for room access
  for (const room of socket.rooms) {
    if (room !== socket.id) {
      return room;
    }
  }
  return undefined;
};

/**
 * Creates a new room and joins the socket to it.
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
 * Joins an existing room with optimized user management.
 */
export const join = async (
  socket: Socket,
  io: Server,
  roomID: string,
  name: string
): Promise<void> => {
  const normalizedRoomID = normalizeRoomId(roomID);

  const isActiveRoom = io.sockets.adapter.rooms.has(normalizedRoomID);
  const isGracePeriodRoom = roomGraceTimers.has(normalizedRoomID);

  if (!(isActiveRoom || isGracePeriodRoom)) {
    socket.emit(RoomServiceMsg.NOT_FOUND, normalizedRoomID);
    return;
  }

  // Cancel grace period if a user is rejoining an empty room
  if (isGracePeriodRoom) {
    cancelGracePeriod(normalizedRoomID);
  }

  const customId = userService.connect(socket, name);
  await socket.join(normalizedRoomID);

  // Update room cache
  const users = roomUsersCache.get(normalizedRoomID) || {};
  users[customId] = name;
  roomUsersCache.set(normalizedRoomID, users);

  socket.emit(RoomServiceMsg.JOIN, customId);
  socket.to(normalizedRoomID).emit(RoomServiceMsg.SYNC_USERS, users);
};

/**
 * Leaves a room with efficient cleanup
 */
export const leave = async (socket: Socket, io: Server): Promise<void> => {
  try {
    if (!socket || socket.disconnected) {
      return;
    }

    const roomID = getUserRoom(socket);
    if (!roomID) {
      return;
    }

    const customId = userService.getSocCustomId(socket);
    if (!customId) {
      return;
    }

    const users = roomUsersCache.get(roomID);
    if (users) {
      delete users[customId];
      if (Object.keys(users).length === 0) {
        // Room is empty — start grace period instead of immediate deletion.
        // Room data (code, notes) is preserved so users can rejoin.
        roomUsersCache.delete(roomID);
        startGracePeriod(roomID);
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
 * Terminates a room immediately, cleaning up all data and disconnecting all users.
 * Unlike leave(), this skips the grace period and deletes room data right away.
 */
export const terminate = (socket: Socket, io: Server): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) {
    return;
  }

  // Notify all other users in the room that it's being terminated
  socket.to(roomID).emit(RoomServiceMsg.TERMINATE);

  // Disconnect all sockets from the room
  const room = io.sockets.adapter.rooms.get(roomID);
  if (room) {
    for (const socketId of room) {
      const sock = io.sockets.sockets.get(socketId);
      if (sock) {
        userService.disconnect(sock);
        sock.leave(roomID);
      }
    }
  }

  // Clean up all room data immediately (no grace period)
  cleanupRoomCache(roomID);
};

/**
 * Gets users in a room with caching for better performance
 */
export const getUsersInRoom = (
  socket: Socket,
  io: Server,
  roomID: string = getUserRoom(socket) ?? ""
): Record<string, string> => {
  // Return empty object if no room
  if (!roomID) {
    return {};
  }

  // Check cache first
  let users = roomUsersCache.get(roomID);

  // If not in cache, rebuild it
  if (!users) {
    const room = io.sockets.adapter.rooms.get(roomID);
    if (!room) {
      return {};
    }

    users = {};
    for (const socketId of room) {
      const username = userService.getUsername(socketId);
      const sock = io.sockets.sockets.get(socketId);
      if (!sock) {
        continue;
      }
      const customId = userService.getSocCustomId(sock);
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
 * Clean up all data for a room including any grace period timer.
 */
export const cleanupRoomCache = (roomID: string): void => {
  roomUsersCache.delete(roomID);
  roomNotes.delete(roomID);
  codeService.deleteRoom(roomID);
  cancelGracePeriod(roomID);
};

/**
 * Get the note for a room
 */
export const syncNote = (socket: Socket, io: Server): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) {
    return;
  }

  const note = roomNotes.get(roomID) || "";
  io.to(socket.id).emit(RoomServiceMsg.UPDATE_MD, note);
};

/**
 * Update the note for a room
 */
export const updateNote = (socket: Socket, note: string): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) {
    return;
  }

  socket.to(roomID).emit(RoomServiceMsg.UPDATE_MD, note);
  roomNotes.set(roomID, note);
};

export const updateExecuting = (socket: Socket, executing: boolean): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) {
    return;
  }

  socket.to(roomID).emit(CodeServiceMsg.EXEC, executing);
};

/**
 * Update the terminal for a room
 */
export const updateTerminal = (socket: Socket, data: ExecutionResult): void => {
  const roomID = getUserRoom(socket);
  if (!roomID) {
    return;
  }

  socket.to(roomID).emit(CodeServiceMsg.UPDATE_TERM, data);
};
