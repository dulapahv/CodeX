/**
 * Room ID generator function.
 * Features:
 * - 8 character random IDs
 * - Alphanumeric characters
 * - Uppercase letters only
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export const generateRoomID = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
