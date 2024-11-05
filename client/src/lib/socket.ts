import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

import { BASE_SERVER_URL } from "./constants";

let socketInstance: Socket | null = null;

/**
 * Returns a singleton socket instance
 * @returns {Socket}
 */
export const socket: Socket = (() => {
  if (!socketInstance) {
    socketInstance = io(BASE_SERVER_URL);
    if (!socketInstance.connected) {
      socketInstance.connect();
    }
  }
  return socketInstance;
})();
