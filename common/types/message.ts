/**
 * TX = Transmit (to server)
 * RX = Receive (from server)
 */

export enum UserServiceMsg {
  CURSOR_RX = 'A',
  CURSOR_TX = 'B',
}

export enum RoomServiceMsg {
  CREATE = 'C',
  JOIN = 'D',
  LEAVE = 'E',
  CREATED = 'F',
  JOINED = 'G',
  NOT_FOUND = 'H',
  UPDATE_USERS = 'I',
  GET_USERS = 'J',
  USER_LEFT = 'K',
  GET_MD = 'L',
  MD_TX = 'M',
  MD_RX = 'N',
}

export enum CodeServiceMsg {
  GET_CODE = 'O',
  RECEIVE_CODE = 'P',
  CODE_TX = 'Q',
  CODE_RX = 'R',
  GET_LANG = 'S',
  LANG_TX = 'T',
  LANG_RX = 'U',
}
