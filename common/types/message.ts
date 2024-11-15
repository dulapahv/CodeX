/**
 * TX = Transmit (to server)
 * RX = Receive (from server)
 */

export enum UserServiceMsg {
  DISC = 'dc',
  CURSOR_RX = 'curRx',
  CURSOR_TX = 'curTx',
}

export enum RoomServiceMsg {
  CREATE = 'crRm',
  JOIN = 'jnRm',
  LEAVE = 'lvRm',
  CREATED = 'rmCr',
  JOINED = 'rmJn',
  NOT_FOUND = 'rmNF',
  UPDATE_USERS = 'updUsr',
  GET_USERS = 'gtUsr',
  USER_LEFT = 'usrLf',
}

export enum CodeServiceMsg {
  GET_CODE = 'gtCd',
  RECEIVE_CODE = 'rcCd',
  CODE_TX = 'cdTx',
  CODE_RX = 'cdRx',
  GET_LANG = 'gtLng',
  LANG_TX = 'lngTx',
  LANG_RX = 'lngRx',
}
