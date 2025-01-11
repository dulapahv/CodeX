/**
 * Socket.IO message type enums for service communication.
 * Features:
 * - Room service messages
 * - Code editing messages
 * - Scroll sync messages
 * - Video stream messages
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export enum RoomServiceMsg {
  CREATE = 'A',
  JOIN = 'B',
  LEAVE = 'C',
  NOT_FOUND = 'D',
  SYNC_USERS = 'E',
  SYNC_MD = 'F',
  UPDATE_MD = 'G',
}

export enum CodeServiceMsg {
  SYNC_CODE = 'H',
  UPDATE_CODE = 'I',
  UPDATE_CURSOR = 'J',
  SYNC_LANG = 'K',
  UPDATE_LANG = 'L',
  EXEC = 'M',
  UPDATE_TERM = 'N',
}

export enum ScrollServiceMsg {
  UPDATE_SCROLL = 'O',
}

export enum StreamServiceMsg {
  USER_READY = 'P',
  STREAM_READY = 'Q',
  SIGNAL = 'R',
  STREAM = 'S',
  USER_DISCONNECTED = 'T',
  CAMERA_OFF = 'U',
  MIC_STATE = 'V',
  SPEAKER_STATE = 'W',
}

export enum PointerServiceMsg {
  POINTER = 'X',
}
