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
  TERM_TX = 'O',
  TERM_RX = 'P',
  EXEC_TX = 'Q',
  EXEC_RX = 'R',
}

export enum CodeServiceMsg {
  GET_CODE = 'R',
  RECEIVE_CODE = 'S',
  CODE_TX = 'T',
  CODE_RX = 'U',
  GET_LANG = 'V',
  LANG_TX = 'W',
  LANG_RX = 'X',
}
