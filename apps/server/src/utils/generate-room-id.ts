/**
 * Room ID generator function.
 * Features:
 * - 8 character random IDs
 * - Uppercase letters and digits
 * - No look-alike characters (I, L, O, 0, 1)
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

// Rooms made before look-alikes were dropped can still contain them, so
// normalizeRoomId keeps accepting the full A-Z and 0-9 range
const ROOM_ID_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ROOM_ID_LENGTH = 8;

export const generateRoomID = () => {
  let result = "";
  for (let i = 0; i < ROOM_ID_LENGTH; i += 1) {
    result += ROOM_ID_ALPHABET.charAt(
      Math.floor(Math.random() * ROOM_ID_ALPHABET.length)
    );
  }
  return result;
};
