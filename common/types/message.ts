export enum RoomServiceMsg {
  CREATE_ROOM = 'create-room',
  JOIN_ROOM = 'join-room',
  LEAVE_ROOM = 'leave-room',
  ROOM_CREATED = 'room-created',
  ROOM_JOINED = 'room-joined',
  ROOM_NOT_FOUND = 'room-not-found',
  UPDATE_CLIENT_LIST = 'update-client-list',
  GET_USERS = 'get-users',
}

export enum UserServiceMsg {
  DISCONNECT = 'disconnect',
  RECEIVE_CURSOR = 'receive-cursor',
  SEND_CURSOR = 'send-cursor',
}

export enum CodeServiceMsg {
  GET_CODE = 'get-code',
  RECEIVE_CODE = 'receive-code',
  SEND_EDIT = 'send-edit',
  RECEIVE_EDIT = 'receive-edit',
}
