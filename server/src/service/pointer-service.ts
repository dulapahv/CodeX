import type { Socket } from 'socket.io';

import { PointerServiceMsg } from '@common/types/message';
import type { Pointer } from '@common/types/pointer';

import { getUserRoom } from '../service/room-service';
import { getCustomId } from '../service/user-service';

export const updatePointer = (socket: Socket, pointer: Pointer) => {
  const roomID = getUserRoom(socket);
  if (!roomID) return;

  const customId = getCustomId(socket.id);
  if (customId) {
    socket.to(roomID).emit(PointerServiceMsg.POINTER, customId, pointer);
  }
};
