/**
 * This library is responsible for creating a singleton socket instance.
 * To use this library, you need to import it and call the getSocket function.
 * For example: const socket = getSocket();
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev).
 */

import { io, type Socket } from 'socket.io-client';

import { BASE_SERVER_URL } from './constants';

let socketInstance: Socket | null = null;

/**
 * Returns a singleton socket instance
 * @returns {Socket}
 */
export const getSocket = (): Socket => {
  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io(BASE_SERVER_URL, {
      transports: ['websocket', 'polling'], // WebTransport is not implemented due to operational complexities
      autoConnect: false,
    });
  }

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
};
