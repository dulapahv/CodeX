/**
 * WebRTC service handlers for peer-to-peer video streaming.
 * Features:
 * - Stream signaling
 * - Camera state sync
 * - User notification
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { StreamServiceMsg } from "@codex/types/message";
import type { SignalData } from "simple-peer";
import type { Socket } from "@/types";

import * as roomService from "./room-service";
import * as userService from "./user-service";

// Notify all other users in the room that this user is ready to stream
export const onStreamReady = (socket: Socket) => {
  const room = roomService.getUserRoom(socket);
  const customId = userService.getCustomId(socket.id);
  if (room && customId) {
    socket.to(room).emit(StreamServiceMsg.USER_READY, customId);
  }
};

// Forward the WebRTC signal to the specific user
export const handleSignal = (socket: Socket, signal: SignalData) => {
  const room = roomService.getUserRoom(socket);
  const customId = userService.getCustomId(socket.id);
  if (!(room && customId)) {
    return;
  }
  socket.to(room).emit(StreamServiceMsg.SIGNAL, {
    userID: customId,
    signal,
  });
};

// Notify all other users in the room that this user's camera is off
export const onCameraOff = (socket: Socket) => {
  const room = roomService.getUserRoom(socket);
  const customId = userService.getCustomId(socket.id);
  if (room && customId) {
    socket.to(room).emit(StreamServiceMsg.CAMERA_OFF, customId);
  }
};

export const handleMicState = (socket: Socket, micOn: boolean) => {
  const room = roomService.getUserRoom(socket);
  const customId = userService.getCustomId(socket.id);
  if (room && customId) {
    socket.to(room).emit(StreamServiceMsg.MIC_STATE, {
      userID: customId,
      micOn,
    });
  }
};

export const handleSpeakerState = (socket: Socket, speakersOn: boolean) => {
  const room = roomService.getUserRoom(socket);
  const customId = userService.getCustomId(socket.id);
  if (room && customId) {
    socket.to(room).emit(StreamServiceMsg.SPEAKER_STATE, {
      userID: customId,
      speakersOn,
    });
  }
};
