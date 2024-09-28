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
}
