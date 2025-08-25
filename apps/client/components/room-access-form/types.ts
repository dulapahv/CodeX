/**
 * Type definitions for room access form data.
 * Includes:
 * - Create room form types
 * - Join room form types
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

export interface CreateRoomForm {
  name: string;
}

export interface JoinRoomForm {
  name: string;
  roomId: string;
}
