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

import { hostKeys, seats } from "@/lib/realtime/room-tokens";
import {
  checkRoom,
  createRoomOnServer,
  type RoomCheck,
} from "@/lib/realtime/rooms";
import { storage } from "@/lib/services/storage";

const DASH_PATTERN = /-/gu;
const NON_ALPHANUMERIC_PATTERN = /[^A-Z0-9]/gu;
const ROOM_ID_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/u;

// Creates a room and returns its ID formatted for display ("ABCD-EFGH")
export const createRoom = async (name: string): Promise<string> => {
  const { hostToken, roomId } = await createRoomOnServer();
  // This tab is the host, and this browser can take the host's seat back
  seats.save(roomId, hostToken);
  hostKeys.save(roomId, hostToken);
  storage.setUsername(name);
  return formatRoomId(roomId);
};

const CHECK_ERRORS: Record<Exclude<RoomCheck, "open">, string> = {
  locked: "This room is locked. Ask the host to unlock it so you can join.",
  "not-found": "Room does not exist. Please check the room ID and try again.",
  removed: "The host removed you from this room.",
};

// Checked first, so someone who can't join is told so here instead of
// seeing the room before it sends them back
export const joinRoom = async (roomId: string, name: string) => {
  const check = await checkRoom(roomId.replace(DASH_PATTERN, ""));
  if (check !== "open") {
    throw new Error(CHECK_ERRORS[check]);
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
