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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormSetValue } from 'react-hook-form';

import { formatRoomId } from '@/utils/format-room-id';

import type { JoinRoomForm } from './types';
import { joinRoomSchema } from './validator';

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
    shouldValidate: true,
  });
};

/**
 * Custom hook for managing join room form state
 * @param roomId - Initial room ID to populate form
 * @returns React Hook Form instance with zod validation
 */
export const useJoinRoomForm = (roomId: string) => {
  return useForm<JoinRoomForm>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      name: '',
      roomId: roomId,
    },
  });
};
