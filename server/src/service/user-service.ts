import { Server, Socket } from 'socket.io';

import { UserServiceMsg } from '../../../common/types/message';
import { Cursor } from '../../../common/types/operation';
import { del, get, set } from '../lib/vercel-kv';

export async function connect(socket: Socket, name: string): Promise<void> {
  set(socket.id, name);
  console.log('User connected:', socket.id);
}

export async function disconnect(socket: Socket): Promise<void> {
  del(socket.id);
  console.log('User disconnected:', socket.id);
}

export async function updateCursor(
  socket: Socket,
  io: Server,
  roomID: string,
  cursor: Cursor
): Promise<void> {
  const name = await get(socket.id);
  if (!name) return;

  // Update cursor for all users in the room except the sender
  socket.to(roomID).emit(UserServiceMsg.RECEIVE_CURSOR, name, cursor);
}
