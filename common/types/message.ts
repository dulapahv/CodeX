/**
 * TX = Transmit (to server)
 * RX = Receive (from server)
 */

export enum UserServiceMsg {
  CURSOR_RX = 'A',
  CURSOR_TX = 'B',
}

export enum RoomServiceMsg {
  CREATE = 'E',
  JOIN = 'F',
  LEAVE = 'L',
  CREATED = 'G',
  JOINED = 'H',
  NOT_FOUND = 'I',
  UPDATE_USERS = 'J',
  GET_USERS = 'K',
  USER_LEFT = 'M',
}

export enum CodeServiceMsg {
  GET_CODE = 'N',
  RECEIVE_CODE = 'O',
  CODE_TX = 'C',
  CODE_RX = 'D',
  GET_LANG = 'P',
  LANG_TX = 'Q',
  LANG_RX = 'R',
}
