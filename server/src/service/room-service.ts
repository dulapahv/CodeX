// service/room-service.ts
import { Server, Socket } from 'socket.io';

import { RoomServiceMsg } from '../../../common/types/message';
import { generateRoomID } from '../utils/generate-room-id';
import { normalizeRoomId } from '../utils/normalize-room-id';
import * as codeService from './code-service';
import * as userService from './user-service';

/**
 * Get the room ID that a user is currently in
 * @param socket Socket instance
 * @returns Room ID if user is in a room, undefined otherwise
 */
export const getUserRoom = (socket: Socket): string | undefined => {
  const rooms = Array.from(socket.rooms);
  return rooms.length > 1 ? rooms[1] : undefined;
};

/**
 * Creates a new room and joins the socket to it
 * @param socket Socket instance
 * @param name Username
 */
export const create = (socket: Socket, name: string): void => {
  const customId = userService.connect(socket, name);

  let roomID: string;
  do {
    roomID = generateRoomID();
  } while (codeService.roomExists(roomID));

  socket.join(roomID);
  socket.emit(RoomServiceMsg.CREATED, roomID, customId);
};

/**
 * Joins an existing room
 * @param socket Socket instance
 * @param io Server instance
 * @param roomID Room identifier
 * @param name Username
 */
export const join = (
  socket: Socket,
  io: Server,
  roomID: string,
  name: string,
): void => {
  roomID = normalizeRoomId(roomID);

  if (!io.sockets.adapter.rooms.has(roomID)) {
    socket.emit(RoomServiceMsg.NOT_FOUND, roomID);
    return;
  }

  const customId = userService.connect(socket, name);
  socket.join(roomID);

  // Tell the client they joined the room with their custom ID
  socket.emit(RoomServiceMsg.JOINED, customId);

  // Tell all clients in the room to update their client list
  const users = getUsersInRoom(socket, io, roomID);
  socket.in(roomID).emit(RoomServiceMsg.UPDATE_USERS, users);
};

/**
 * Leaves a room and updates other clients
 * @param socket Socket instance
 * @param io Server instance
 * @param roomID Room identifier
 */
export const leave = (socket: Socket, io: Server, roomID: string): void => {
  roomID = normalizeRoomId(roomID);
  const customId = userService.getSocCustomId(socket);

  socket.leave(roomID);
  userService.disconnect(socket);

  // Tell all clients in the room to update their client list
  const users = getUsersInRoom(socket, io, roomID);
  socket.in(roomID).emit(RoomServiceMsg.UPDATE_USERS, users);

  // Tell all clients in the room who left using custom ID
  if (customId) {
    socket.in(roomID).emit(RoomServiceMsg.USER_LEFT, customId);
  }
};

/**
 * Gets a mapping of custom IDs to usernames for all users in a room
 * @param socket Socket instance
 * @param io Server instance
 * @param roomID Room identifier
 * @returns Object mapping custom IDs to usernames
 */
export const getUsersInRoom = (
  socket: Socket,
  io: Server,
  roomID: string = getUserRoom(socket),
): Record<string, string> => {
  const room = io.sockets.adapter.rooms.get(roomID);

  if (!room) return {};

  // Create a dictionary of custom IDs to usernames
  const usersDict = Array.from(room).reduce(
    (acc: Record<string, string>, socketId) => {
      const username = userService.getUsername(socketId);
      const customId = userService.getSocCustomId(
        io.sockets.sockets.get(socketId),
      );
      if (username !== undefined && customId !== undefined) {
        acc[customId] = username;
      }
      return acc;
    },
    {},
  );

  // Tell the client who joined the room
  io.to(socket.id).emit(RoomServiceMsg.UPDATE_USERS, usersDict);
  return usersDict;
};
