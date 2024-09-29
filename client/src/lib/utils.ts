import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { socket } from "@/lib/socket";

import { RoomServiceMsg } from "../../../common/types/message";

export function createRoom(name: string): Promise<string> {
  return new Promise((resolve, reject) => {
    socket().emit(RoomServiceMsg.CREATE_ROOM, name);
    socket().on(RoomServiceMsg.ROOM_CREATED, (roomId: string) => {
      resolve(roomId);
    });
  });
}

export function joinRoom(roomId: string, name: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    socket().emit(RoomServiceMsg.JOIN_ROOM, roomId, name);
    socket().on(RoomServiceMsg.ROOM_NOT_FOUND, (roomID: string) => {
      reject(
        new Error(
          `Room does not exist. Please check the room ID and try again.`,
        ),
      );
    });
    socket().on(RoomServiceMsg.ROOM_JOINED, () => {
      resolve(true);
    });
  });
}

export function leaveRoom(roomId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    socket().emit(RoomServiceMsg.LEAVE_ROOM, roomId);
  });
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
};

// Hashing function to generate a unique number from a string
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
