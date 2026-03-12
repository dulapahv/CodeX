/**
 * Utility functions for room management operations.
 * Features:
 * - Room creation handling
 * - Room joining validation
 * - Room ID formatting
 * - Socket communications
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { RoomServiceMsg } from "@codex/types/message";
import type { ChangeEvent } from "react";

import { storage } from "@/lib/services/storage";
import { getSocket } from "@/lib/socket";

const DASH_PATTERN = /-/g;
const NON_ALPHANUMERIC_PATTERN = /[^A-Z0-9]/g;
const ROOM_ID_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export const createRoom = (name: string): Promise<string> => {
  return new Promise((resolve) => {
    const socket = getSocket();

    socket.once(RoomServiceMsg.CREATE, (roomId: string, userID: string) => {
      const formattedRoomId = formatRoomId(roomId);

      storage.setRoomId(formattedRoomId);
      storage.setUserId(userID);

      resolve(formattedRoomId);
    });
    socket.emit(RoomServiceMsg.CREATE, name);
  });
};

export const joinRoom = (roomId: string, name: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();

    const cleanedRoomId = roomId.replace(DASH_PATTERN, "");

    const handleNotFound = () => {
      socket.off(RoomServiceMsg.JOIN, handleJoin);
      reject("Room does not exist. Please check the room ID and try again.");
    };
    const handleJoin = (userID: string) => {
      socket.off(RoomServiceMsg.NOT_FOUND, handleNotFound);
      storage.setRoomId(cleanedRoomId);
      storage.setUserId(userID);
      resolve(true);
    };

    socket.once(RoomServiceMsg.NOT_FOUND, handleNotFound);
    socket.once(RoomServiceMsg.JOIN, handleJoin);
    socket.emit(RoomServiceMsg.JOIN, cleanedRoomId, name);
  });
};

/**
 * Handles room ID input changes with formatting
 * @param e - Change event from input element
 */
export const onRoomIdChange = (e: ChangeEvent<HTMLInputElement>) => {
  const rawValue = e.target.value.toUpperCase();
  e.target.value = formatRoomId(rawValue);
};

const formatRoomId = (value: string) => {
  // Remove any non-alphanumeric characters
  const cleaned = value.replace(NON_ALPHANUMERIC_PATTERN, "");

  // Limit to 8 characters
  const truncated = cleaned.slice(0, 8);

  // Add dash after first 4 characters if length > 4
  if (truncated.length > 4) {
    return `${truncated.slice(0, 4)}-${truncated.slice(4)}`;
  }

  return truncated;
};

/**
 * Checks if the room ID is valid (XXXX-XXXX where X is alphanumeric)
 * @param value
 * @returns
 */
export const isRoomIdValid = (value: string) => ROOM_ID_PATTERN.test(value);
