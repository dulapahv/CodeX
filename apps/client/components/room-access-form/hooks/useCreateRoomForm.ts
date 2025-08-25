/**
 * Custom hook for handling room creation form state.
 * Features:
 * - Form validation with Zod
 * - Room name validation
 * - Default values handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
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
