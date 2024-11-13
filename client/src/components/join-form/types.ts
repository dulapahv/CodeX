/**
 * Type definitions for room-related form interfaces.
 *
 * @example
 * ```ts
 * const createForm: CreateRoomForm = { name: "John" };
 * const joinForm: JoinRoomForm = { name: "John", roomId: "abc123" };
 * ```
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

/**
 * Interface for room creation form data
 * @interface
 * @property {string} name - User's display name for the room
 */
export interface CreateRoomForm {
  name: string;
}

/**
 * Interface for room joining form data
 * @interface
 * @property {string} name - User's display name for the room
 * @property {string} roomId - Unique identifier of room to join
 */
export interface JoinRoomForm {
  name: string;
  roomId: string;
}
