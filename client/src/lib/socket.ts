/**
 * This library is responsible for creating a singleton socket instance.
 * To use this library, you need to import it and call the getSocket function.
 * For example: const socket = getSocket();
 *
 * Created by Dulapah Vibulsanti (https://github.com/dulapahv).
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
      autoConnect: false,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
};
