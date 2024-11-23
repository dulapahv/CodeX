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

export enum StreamServiceMsg {
  USER_READY = 'O',
  STREAM_READY = 'P',
  SIGNAL = 'Q',
  STREAM = 'R',
  USER_DISCONNECTED = 'S',
  CAMERA_OFF = 'T',
}
