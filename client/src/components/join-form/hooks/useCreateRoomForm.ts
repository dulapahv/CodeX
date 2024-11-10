import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import type { CreateRoomForm } from '../types/form';
import { createRoomSchema } from '../validator';

export const useCreateRoomForm = () => {
  return useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
    },
  });
};
