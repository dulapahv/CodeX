import { ArrowRight, LoaderCircle } from 'lucide-react';
import type {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { JoinRoomForm } from '../types/form';

interface JoinRoomSectionProps {
  register: UseFormRegister<JoinRoomForm>;
  handleSubmit: UseFormHandleSubmit<JoinRoomForm>;
  onSubmit: (data: JoinRoomForm) => Promise<void> | Promise<any>;
  onError: () => void;
  errors: FieldErrors<JoinRoomForm>;
  isSubmitting: boolean;
  isCreating: boolean;
  room: string;
}

export const JoinRoomSection = ({
  register,
  handleSubmit,
  onSubmit,
  onError,
  errors,
  isSubmitting,
  isCreating,
  room,
}: JoinRoomSectionProps) => (
  <form onSubmit={handleSubmit((data) => onSubmit(data), onError)}>
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-medium">Join a Room</h3>
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="room-id">Room ID</Label>
        <Input
          id="room-id"
          placeholder="Enter room ID"
          disabled={!!room || isCreating || isSubmitting}
          {...register('roomId')}
        />
        {errors.roomId && (
          <p className="text-sm text-red-500">{errors.roomId.message}</p>
        )}
      </div>
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="name-join">Name</Label>
        <Input
          id="name-join"
          placeholder="Enter your name"
          disabled={isCreating || isSubmitting}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      <Button
        type="submit"
        className="bg-primary"
        disabled={isSubmitting || isCreating}
      >
        {isSubmitting && <LoaderCircle className="mr-2 size-4 animate-spin" />}
        {isSubmitting ? 'Joining...' : 'Join Room'}
        {!isSubmitting && <ArrowRight className="ml-2 size-4" />}
      </Button>
    </div>
  </form>
);
