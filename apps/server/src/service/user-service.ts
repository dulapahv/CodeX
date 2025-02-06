/**
 * User management service for handling user identity and state.
 * Features:
 * - User ID generation
 * - Socket/user mapping
 * - Data persistence
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Socket } from 'socket.io';

import { CodeServiceMsg } from '@codex/types/message';
import type { Cursor } from '@codex/types/operation';

import { getUserRoom } from './room-service';

// Use a single Map for user data to reduce memory overhead
type UserData = {
  username: string;
  customId: string;
};

// Core data structures optimized for O(1) lookups
const socketToUserData = new Map<string, UserData>();
const customIdToSocketId = new Map<string, string>();

/**
 * Generates the next available ID in sequence (A, B, C, ..., Z, AA, AB, ...)
 * No upper limit on possible combinations
 */
const generateCustomId = (): string => {
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
  } while (customIdToSocketId.has(newId));

  return newId;
};

/**
 * Get username with O(1) lookup
 */
export const getUsername = (socketId: string): string | undefined => {
  return socketToUserData.get(socketId)?.username;
};

/**
 * Connect user with optimized data storage
 * Returns assigned custom ID
 */
export const connect = (socket: Socket, username: string): string => {
  const customId = generateCustomId();
  const userData: UserData = { username, customId };

  socketToUserData.set(socket.id, userData);
  customIdToSocketId.set(customId, socket.id);

  return customId;
};

/**
 * Efficiently clean up user data on disconnect
 */
export const disconnect = (socket: Socket): void => {
  const userData = socketToUserData.get(socket.id);
  if (userData) {
    customIdToSocketId.delete(userData.customId);
    socketToUserData.delete(socket.id);
  }

  socket.disconnect();
};

/**
 * Optimized cursor update broadcasting
 */
export const updateCursor = (socket: Socket, cursor: Cursor): void => {
  const roomId = getUserRoom(socket);
  const userData = socketToUserData.get(socket.id);

  if (userData) {
    socket
      .to(roomId)
      .emit(CodeServiceMsg.UPDATE_CURSOR, userData.customId, cursor);
  }
};

/**
 * Get custom ID with O(1) lookup
 */
export const getSocCustomId = (socket: Socket): string | undefined => {
  return socketToUserData.get(socket.id)?.customId;
};

/**
 * Get socket ID from custom ID with O(1) lookup
 */
export const getSocketId = (customId: string): string | undefined => {
  return customIdToSocketId.get(customId);
};

/**
 * Get custom ID from socket ID with O(1) lookup
 */
export const getCustomId = (socketId: string): string | undefined => {
  return socketToUserData.get(socketId)?.customId;
};

/**
 * Check if custom ID exists with O(1) lookup
 */
export const isCustomIdInUse = (customId: string): boolean => {
  return customIdToSocketId.has(customId);
};
