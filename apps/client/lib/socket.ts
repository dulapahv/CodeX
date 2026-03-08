/**
 * Socket client configuration for real-time communication.
 * Features:
 * - Socket.IO connection setup
 * - Server URL configuration
 * - Connection management
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@codex/types/socket-events";
import { io, type Socket } from "socket.io-client";

import { BASE_SERVER_URL } from "./constants";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socketInstance: TypedSocket | null = null;

/**
 * Returns a singleton typed socket instance
 */
export const getSocket = (): TypedSocket => {
  if (!socketInstance?.connected) {
    socketInstance = io(BASE_SERVER_URL, {
      transports: ["websocket", "polling"],
      autoConnect: false,
      timestampRequests: false,
    }) as TypedSocket;
  }

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
};
