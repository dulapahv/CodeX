/**
 * Custom hook for handling room joining form state.
 * Features:
 * - Form validation with Zod
 * - Room ID validation
 * - Default values handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import type { JoinRoomForm } from '../types';
import { isRoomIdValid } from '../utils';
import { joinRoomSchema } from '../validator';

export const useJoinRoomForm = (roomId: string) => {
  return useForm<JoinRoomForm>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      name: '',
      roomId: isRoomIdValid(roomId) ? roomId : '',
    },
  });
};
