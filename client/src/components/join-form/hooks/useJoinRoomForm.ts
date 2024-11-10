import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { joinRoomSchema } from '../validator';
import type { JoinRoomForm } from '../types/form';

export const useJoinRoomForm = (roomId: string) => {
  return useForm<JoinRoomForm>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      name: '',
      roomId: roomId,
    },
  });
};
