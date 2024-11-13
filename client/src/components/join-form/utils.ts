import { ChangeEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormSetValue } from 'react-hook-form';

import { formatRoomId } from '@/utils/format-room-id';

import type { JoinRoomForm } from './types';
import { joinRoomSchema } from './validator';

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

export const useJoinRoomForm = (roomId: string) => {
  return useForm<JoinRoomForm>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      name: '',
      roomId: roomId,
    },
  });
};
