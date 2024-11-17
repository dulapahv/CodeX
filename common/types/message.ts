/**
 * TX = Transmit (to server)
 * RX = Receive (from server)
 */

export enum UserServiceMsg {
  DISC = 'A',
  CURSOR_RX = 'B',
  CURSOR_TX = 'C',
}

export enum RoomServiceMsg {
  CREATE = 'D',
  JOIN = 'E',
  LEAVE = 'F',
  CREATED = 'G',
  JOINED = 'H',
  NOT_FOUND = 'I',
  UPDATE_USERS = 'J',
  GET_USERS = 'K',
  USER_LEFT = 'L',
}

export enum CodeServiceMsg {
  GET_CODE = 'M',
  RECEIVE_CODE = 'N',
  CODE_TX = 'O',
  CODE_RX = 'P',
  GET_LANG = 'Q',
  LANG_TX = 'R',
  LANG_RX = 'S',
}
