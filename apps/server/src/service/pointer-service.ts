/**
 * Socket service for handling pointer/cursor position updates.
 * Features:
 * - Real-time pointer sync
 * - Room-based updates
 * - User identity handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { PointerServiceMsg } from "@codex/types/message";
import type { Pointer } from "@codex/types/pointer";
import type { Socket } from "@/types";

import { getUserRoom } from "./room-service";
import { getCustomId } from "./user-service";

export const updatePointer = (socket: Socket, pointer: Pointer) => {
  const roomID = getUserRoom(socket);
  if (!roomID) {
    return;
  }

  const customId = getCustomId(socket.id);
  if (customId) {
    socket.to(roomID).emit(PointerServiceMsg.POINTER, customId, pointer);
  }
};
