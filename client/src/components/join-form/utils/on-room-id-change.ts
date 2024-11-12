import { ChangeEvent } from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import { formatRoomId } from '@/utils/format-room-id';

import type { JoinRoomForm } from '../types/form';

export function onRoomIdChange(
  e: ChangeEvent<HTMLInputElement>,
  setValue: UseFormSetValue<JoinRoomForm>,
) {
  const rawValue = e.target.value.toUpperCase();
  const formattedValue = formatRoomId(rawValue);

  // Update the input value
  e.target.value = formattedValue;

  // Update form value
  setValue('roomId', formattedValue, {
    shouldValidate: true,
  });
}
