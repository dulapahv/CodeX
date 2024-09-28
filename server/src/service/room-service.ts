import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import { RoomServiceMsg } from '../../../common/types/message';
import { get } from '../lib/vercel-kv';
import * as userService from './user-service';

export async function createAndJoin(
  socket: Socket,
  io: Server,
  name: string
): Promise<void> {
  userService.connect(socket, name);

  const roomID = uuidv4().slice(0, 8);
  console.log(`User ${name} created room ${roomID}`);

  socket.join(roomID);
  socket.emit(RoomServiceMsg.ROOM_CREATED, roomID);
  console.log(`User ${name} joined room ${roomID}`);
}

export async function join(
  socket: Socket,
  io: Server,
  roomID: string,
  name: string
): Promise<void> {
  // check if room exists
  if (!io.sockets.adapter.rooms.has(roomID)) {
    console.log(`Room ${roomID} does not exist`);
    socket.emit(RoomServiceMsg.ROOM_NOT_FOUND, roomID);
    return;
  }

  userService.connect(socket, name);
  socket.join(roomID);
  socket.emit(RoomServiceMsg.ROOM_JOINED, name);
  console.log(`User ${name} joined room ${roomID}`);

  // tell all clients in the room to update their client list
  socket
    .in(roomID)
    .emit(
      RoomServiceMsg.UPDATE_CLIENT_LIST,
      await getUsersInRoom(socket, io, roomID)
    );
}

export async function leave(
  socket: Socket,
  io: Server,
  roomID: string
): Promise<void> {
  socket.leave(roomID);
  console.log(`User ${socket.id} left room ${roomID}`);
  userService.disconnect(socket);
  // tell all clients in the room to update their client list
  socket
    .in(roomID)
    .emit(
      RoomServiceMsg.UPDATE_CLIENT_LIST,
      await getUsersInRoom(socket, io, roomID)
    );
}

export async function getUsersInRoom(
  socket: Socket,
  io: Server,
  roomID: string
): Promise<string[]> {
  // get all socket in room
  const socketList = await io.in(roomID).fetchSockets();

  // get all users in the room
  const userslist = await Promise.all(
    socketList.map((socket) => get(socket.id))
  );

  // tell the client who joined the room
  io.to(socket.id).emit(RoomServiceMsg.UPDATE_CLIENT_LIST, userslist);
  return userslist;
}
