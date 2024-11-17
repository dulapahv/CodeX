/**
 * Custom hook for managing the join room form state and validation.
 * Uses React Hook Form with Zod validation schema.
 *
 * @param roomId - Room ID to pre-populate the form with
 *
 * @example
 * ```tsx
 * const { register, handleSubmit, formState: { errors } } = useJoinRoomForm("abc123");
 *
 * <form onSubmit={handleSubmit(onSubmit)}>
 *   <input {...register("name")} />
 *   <input {...register("roomId")} />
 * </form>
 * ```
 *
 * @returns A React Hook Form instance configured with:
 * - Zod validation schema for room joining
 * - Default values for name and roomId
 * - Type-safe form handling via [`JoinRoomForm`](../types.ts)
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import type { JoinRoomForm } from '../types';
import { joinRoomSchema } from '../validator';

export const useJoinRoomForm = (roomId: string) => {
  return useForm<JoinRoomForm>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      name: '',
      roomId: roomId,
    },
  });
};
