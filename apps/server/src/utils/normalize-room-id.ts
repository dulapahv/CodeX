export const normalizeRoomId = (roomId: string): string => {
  return roomId.replace(/-/g, '');
};
