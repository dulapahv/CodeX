export enum RoomServiceMsg {
  CREATE_ROOM = 'create-room',
  JOIN_ROOM = 'join-room',
  LEAVE_ROOM = 'leave-room',
  ROOM_CREATED = 'room-created',
  ROOM_JOINED = 'room-joined',
  ROOM_NOT_FOUND = 'room-not-found',
  UPDATE_USERS = 'update-client-list',
  GET_USERS = 'get-users',
}

export enum UserServiceMsg {
  DISCONNECT = 'disconnect',
  CURSOR_RX = 'receive-cursor',
  CURSOR_TX = 'send-cursor',
}

export enum CodeServiceMsg {
  GET_CODE = 'get-code',
  RECEIVE_CODE = 'receive-code',
  CODE_TX = 'send-edit',
  CODE_RX = 'receive-edit',
}
