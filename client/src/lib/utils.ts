import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { send } from "@/lib/socket";

export function createRoomAndJoin(roomId: string, name: string): Promise<void> {
  send({ type: "create", data: { roomId, name } });
  return joinRoom(roomId, name);
}

export async function joinRoom(roomId: string, name: string): Promise<void> {
  try {
    const result = await send({ type: "join", data: { roomId, name } });
    if (result.toString() === "true") {
      return;
    } else {
      throw new Error(
        "Room does not exist. Please check the room ID and try again.",
      );
    }
  } catch (error) {
    throw error;
  }
}

// /**
//  * Joins an existing room.
//  * Returns a Promise that resolves with a boolean indicating success.
//  * @param roomId - The ID of the room to join.
//  * @param name - The username of the person joining the room.
//  * @returns {Promise<boolean>} - Resolves with `true` if successfully joined, otherwise rejects with an error.
//  */
// export function joinRoom(roomId: string, name: string): Promise<boolean> {
//   return new Promise((resolve, reject) => {
//     // Emit the join-room event
//     socket().emit("join-room", roomId, name);

//     // Listen for room-not-found event to handle non-existent rooms
//     socket().on("room-not-found", (roomID: string) => {
//       reject(
//         new Error(
//           `Room does not exist. Please check the room ID and try again.`,
//         ),
//       ); // Room does not exist
//     });

//     // Listen for room-joined event to confirm successful room join
//     socket().on("room-joined", () => {
//       resolve(true); // Joined successfully
//     });
//   });
// }

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
