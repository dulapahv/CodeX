/**
 * Socket client configuration for real-time communication.
 * Features:
 * - Socket.IO connection setup
 * - Server URL configuration
 * - Connection management
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
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
      transports: ['websocket', 'polling'],
      autoConnect: false,
      timestampRequests: false,
    });
  }

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
};
