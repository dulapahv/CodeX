import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import { RoomServiceMsg } from '../../../common/types/message';
import * as userService from './user-service';

/**
 * Creates a new room and joins the socket to it
 * @param socket Socket instance
 * @param name Username
 */
export function create(socket: Socket, name: string): void {
  userService.connect(socket, name);

  const roomID = uuidv4().slice(0, 8);

  socket.join(roomID);
  socket.emit(RoomServiceMsg.ROOM_CREATED, roomID, socket.id);
}

/**
 * Joins an existing room
 * @param socket Socket instance
 * @param io Server instance
 * @param roomID Room identifier
 * @param name Username
 */
export function join(
  socket: Socket,
  io: Server,
  roomID: string,
  name: string
): void {
  // check if room exists
  if (!io.sockets.adapter.rooms.has(roomID)) {
    socket.emit(RoomServiceMsg.ROOM_NOT_FOUND, roomID);
    return;
  }

  userService.connect(socket, name);
  socket.join(roomID);
  // tell the client they joined the room
  socket.emit(RoomServiceMsg.ROOM_JOINED, socket.id);

  // tell all clients in the room to update their client list
  const users = getUsersInRoom(socket, io, roomID);
  socket.in(roomID).emit(RoomServiceMsg.UPDATE_USERS, users);
}

/**
 * Leaves a room and updates other clients
 * @param socket Socket instance
 * @param io Server instance
 * @param roomID Room identifier
 */
export function leave(socket: Socket, io: Server, roomID: string): void {
  socket.leave(roomID);
  userService.disconnect(socket);

  // tell all clients in the room to update their client list
  const users = getUsersInRoom(socket, io, roomID);
  socket.in(roomID).emit(RoomServiceMsg.UPDATE_USERS, users);
}

/**
 * Gets a mapping of socket IDs to usernames for all users in a room
 * @param socket Socket instance
 * @param io Server instance
 * @param roomID Room identifier
 * @returns Object mapping socket IDs to usernames
 */
export function getUsersInRoom(
  socket: Socket,
  io: Server,
  roomID: string
): Record<string, string> {
  // get all sockets in room
  const room = io.sockets.adapter.rooms.get(roomID);
  if (!room) return {};

  // Create a dictionary of socket IDs to usernames
  const usersDict = Array.from(room).reduce(
    (acc: Record<string, string>, socketId) => {
      const username = userService.getUsername(socketId);
      if (username !== undefined) {
        acc[socketId] = username;
      }
      return acc;
    },
    {}
  );

  // tell the client who joined the room
  io.to(socket.id).emit(RoomServiceMsg.UPDATE_USERS, usersDict);
  return usersDict;
}
