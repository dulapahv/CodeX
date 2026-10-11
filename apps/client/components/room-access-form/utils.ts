/**
 * Utility functions for room management operations.
 * Features:
 * - Room creation handling
 * - Room joining validation
 * - Room ID formatting
 * - Server requests
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ChangeEvent } from "react";

import { createRoomId, roomExists } from "@/lib/realtime/rooms";
import { storage } from "@/lib/services/storage";

const DASH_PATTERN = /-/g;
const NON_ALPHANUMERIC_PATTERN = /[^A-Z0-9]/g;
const ROOM_ID_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/;

// Creates a room and returns its ID formatted for display ("ABCD-EFGH")
export const createRoom = async (name: string): Promise<string> => {
  const roomId = await createRoomId();
  storage.setUsername(name);
  return formatRoomId(roomId);
};

export const joinRoom = async (roomId: string, name: string) => {
  if (!(await roomExists(roomId.replace(DASH_PATTERN, "")))) {
    throw new Error(
      "Room does not exist. Please check the room ID and try again."
    );
  }
  storage.setUsername(name);
};

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
