/**
 * Room creation and lookup against the realtime Worker's HTTP API.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { BASE_SERVER_URL } from "@/lib/constants";

import { getSeatClaim } from "./room-tokens";

export type RoomCheck = "locked" | "not-found" | "open" | "removed";

// The server limits how often one network can create, check and join rooms
const TOO_MANY_REQUESTS = 429;
const TOO_MANY_MESSAGE =
  "Too many tries from your network. Please wait a minute and try again.";

const CHECK_STATUSES: Record<number, RoomCheck> = {
  200: "open",
  403: "removed",
  404: "not-found",
  423: "locked",
};

// The new room's ID, and the token that makes its creator the host
export const createRoomOnServer = async () => {
  const response = await fetch(`${BASE_SERVER_URL}/rooms`, { method: "POST" });
  if (response.status === TOO_MANY_REQUESTS) {
    throw new Error(TOO_MANY_MESSAGE);
  }
  if (!response.ok) {
    throw new Error("Couldn't create a room. Please try again.");
  }
  return (await response.json()) as { hostToken: string; roomId: string };
};

// Whether this tab may join the room now, asked before it shows the room
export const checkRoom = async (roomId: string): Promise<RoomCheck> => {
  const claim = Object.entries(getSeatClaim(roomId)).filter(
    (entry): entry is [string, string] => entry[1] !== undefined
  );
  const response = await fetch(
    `${BASE_SERVER_URL}/rooms/${encodeURIComponent(roomId)}?${new URLSearchParams(claim)}`
  );
  if (response.status === TOO_MANY_REQUESTS) {
    throw new Error(TOO_MANY_MESSAGE);
  }
  const check = CHECK_STATUSES[response.status];
  if (!check) {
    throw new Error("Couldn't reach the server. Please try again.");
  }
  return check;
};
