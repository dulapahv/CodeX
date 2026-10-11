/**
 * Room creation and lookup against the realtime Worker's HTTP API.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { BASE_SERVER_URL } from "@/lib/constants";

const NOT_FOUND = 404;

export const createRoomId = async (): Promise<string> => {
  const response = await fetch(`${BASE_SERVER_URL}/rooms`, { method: "POST" });
  if (!response.ok) {
    throw new Error("Couldn't create a room. Please try again.");
  }
  const { roomId } = (await response.json()) as { roomId: string };
  return roomId;
};

export const roomExists = async (roomId: string): Promise<boolean> => {
  const response = await fetch(
    `${BASE_SERVER_URL}/rooms/${encodeURIComponent(roomId)}`
  );
  if (response.status === NOT_FOUND) {
    return false;
  }
  if (!response.ok) {
    throw new Error("Couldn't reach the server. Please try again.");
  }
  return true;
};
