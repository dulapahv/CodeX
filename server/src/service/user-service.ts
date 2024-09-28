import { Socket } from 'socket.io';

import { del, set } from '../lib/vercel-kv';

export async function connect(socket: Socket, name: string): Promise<void> {
  set(socket.id, name);
  console.log('User connected:', socket.id);
}

export async function disconnect(socket: Socket): Promise<void> {
  del(socket.id);
  console.log('User disconnected:', socket.id);
}
