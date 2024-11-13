/**
 * Custom hook for managing the create room form state and validation.
 * Uses React Hook Form with Zod validation schema.
 *
 * @example
 * ```tsx
 * const { register, handleSubmit, formState: { errors } } = useCreateRoomForm();
 *
 * <form onSubmit={handleSubmit(onSubmit)}>
 *   <input {...register("name")} />
 * </form>
 * ```
 *
 * @returns A React Hook Form instance configured with:
 * - Zod validation schema for room creation
 * - Default empty name value
 * - Type-safe form handling
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import type { CreateRoomForm } from '../types';
import { createRoomSchema } from '../validator';

export const useCreateRoomForm = () => {
  return useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
    },
  });
};
