/**
 * Utility functions for handling room join form functionality.
 * Contains form handlers and event handlers for the join room form.
 *
 * @example
 * ```tsx
 * const form = useJoinRoomForm("ABC123");
 * <input onChange={(e) => onRoomIdChange(e, form.setValue)} />
 * ```
 *
 * @see
 * - [`formatRoomId`](src/utils/format-room-id.ts) - Room ID formatting
 * - [`JoinRoomForm`](./types.ts) - Form interface
 * - [`joinRoomSchema`](./validator.ts) - Validation schema
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ChangeEvent } from 'react';

import type { UseFormSetValue } from 'react-hook-form';

import { RoomServiceMsg } from '@kasca/types/message';

import { storage } from '@/lib/services/storage';
import { getSocket } from '@/lib/socket';

import type { JoinRoomForm } from './types';

export const createRoom = (name: string): Promise<string> => {
  return new Promise((resolve) => {
    const socket = getSocket();
    name = name.trim();
    socket.emit(RoomServiceMsg.CREATE, name);
    socket.on(RoomServiceMsg.CREATE, (roomId: string, userID: string) => {
      roomId = formatRoomId(roomId);

      storage.setRoomId(roomId);
      storage.setUserId(userID);

      resolve(roomId);
    });
  });
};

export const joinRoom = (roomId: string, name: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const socket = getSocket();

    roomId = roomId.replace(/-/g, '');
    name = name.trim();

    socket.emit(RoomServiceMsg.JOIN, roomId, name);
    socket.on(RoomServiceMsg.NOT_FOUND, () => {
      reject('Room does not exist. Please check the room ID and try again.');
    });
    socket.on(RoomServiceMsg.JOIN, (userID: string) => {
      storage.setRoomId(roomId);
      storage.setUserId(userID);
      resolve(true);
    });
  });
};

/**
 * Handles room ID input changes with formatting
 * @param e - Change event from input element
 * @param setValue - React Hook Form setValue function
 */
export const onRoomIdChange = (
  e: ChangeEvent<HTMLInputElement>,
  setValue: UseFormSetValue<JoinRoomForm>,
) => {
  const rawValue = e.target.value.toUpperCase();
  const formattedValue = formatRoomId(rawValue);

  // Update the input value
  e.target.value = formattedValue;

  // Update form value
  setValue('roomId', formattedValue, {
    shouldValidate: formattedValue.length === 9,
  });
};

const formatRoomId = (value: string) => {
  // Remove any non-alphanumeric characters
  const cleaned = value.replace(/[^A-Z0-9]/g, '');

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
export const isRoomIdValid = (value: string) =>
  /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(value);
