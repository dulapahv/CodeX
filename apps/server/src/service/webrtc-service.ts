/**
 * WebRTC service handlers for peer-to-peer video streaming.
 * Features:
 * - Stream signaling
 * - Camera state sync
 * - User notification
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { SignalData } from 'simple-peer';
import type { Socket } from 'socket.io';

import { StreamServiceMsg } from '@codex/types/message';

import * as roomService from './room-service';
import * as userService from './user-service';

// Notify all other users in the room that this user is ready to stream
export const onStreamReady = (socket: Socket) => {
  const room = roomService.getUserRoom(socket);
  if (room) {
    socket
      .to(room)
      .emit(StreamServiceMsg.USER_READY, userService.getCustomId(socket.id));
  }
};

// Forward the WebRTC signal to the specific user
export const handleSignal = (socket: Socket, signal: SignalData) => {
  const room = roomService.getUserRoom(socket);
  if (!room) return;
  socket.to(room).emit(StreamServiceMsg.SIGNAL, {
    userID: userService.getCustomId(socket.id),
    signal,
  });
};

// Notify all other users in the room that this user's camera is off
export const onCameraOff = (socket: Socket) => {
  const room = roomService.getUserRoom(socket);
  if (room) {
    socket
      .to(room)
      .emit(StreamServiceMsg.CAMERA_OFF, userService.getCustomId(socket.id));
  }
};

export const handleMicState = (socket: Socket, micOn: boolean) => {
  const room = roomService.getUserRoom(socket);
  if (room) {
    socket.to(room).emit(StreamServiceMsg.MIC_STATE, {
      userID: userService.getCustomId(socket.id),
      micOn,
    });
  }
};

export const handleSpeakerState = (socket: Socket, speakersOn: boolean) => {
  const room = roomService.getUserRoom(socket);
  if (room) {
    socket.to(room).emit(StreamServiceMsg.SPEAKER_STATE, {
      userID: userService.getCustomId(socket.id),
      speakersOn,
    });
  }
};
