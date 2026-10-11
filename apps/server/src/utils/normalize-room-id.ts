/**
 * Normalises a room ID as typed or shared ("abcd-efgh") to the stored form
 * ("ABCDEFGH"), or null when it can't be a room ID.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

const DASH_PATTERN = /-/g;
const ROOM_ID_PATTERN = /^[A-Z0-9]{8}$/;

export const normalizeRoomId = (roomId: string): string | null => {
  const normalized = roomId.replace(DASH_PATTERN, "").toUpperCase();
  return ROOM_ID_PATTERN.test(normalized) ? normalized : null;
};
