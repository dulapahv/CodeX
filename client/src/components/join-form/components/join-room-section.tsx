/**
 * JoinRoomSection component that renders a form for joining an existing room.
 * Provides input fields for room ID and validation handling.
 *
 * @example
 * ```tsx
 * <JoinRoomSection
 *   register={register}
 *   setValue={setValue}
 *   handleSubmit={handleSubmit}
 *   onSubmit={handleJoinRoom}
 *   onError={handleError}
 *   errors={errors}
 *   isSubmitting={isSubmitting}
 *   isCreating={isCreating}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.register - React Hook Form register function for form fields
 * @param props.setValue - React Hook Form setValue function for updating
 *                         form values
 * @param props.handleSubmit - React Hook Form submit handler
 * @param props.onSubmit - Function called when form is submitted successfully
 * @param props.onError - Function called when form submission fails
 * @param props.errors - Form validation errors from React Hook Form
 * @param props.isSubmitting - Whether form is currently submitting
 * @param props.isCreating - Whether a new room is being created
 *
 * @returns A form section with room ID input and join button
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { GeistMono } from 'geist/font/mono';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import type {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { JoinRoomForm } from '../types';
import { onRoomIdChange } from '../utils';

interface JoinRoomSectionProps {
  register: UseFormRegister<JoinRoomForm>;
  setValue: UseFormSetValue<JoinRoomForm>;
  handleSubmit: UseFormHandleSubmit<JoinRoomForm>;
  onSubmit: (data: JoinRoomForm) => Promise<void> | Promise<any>;
  onError: () => void;
  errors: FieldErrors<JoinRoomForm>;
  isSubmitting: boolean;
  isCreating: boolean;
}

export const JoinRoomSection = ({
  register,
  setValue,
  handleSubmit,
  onSubmit,
  onError,
  errors,
  isSubmitting,
  isCreating,
}: JoinRoomSectionProps) => {
  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data), onError)}>
      <div className="flex flex-col space-y-4">
        <h3 className="text-lg font-medium">Join a Room</h3>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="room-id">Room ID</Label>
          <Input
            id="room-id"
            placeholder="XXXX-XXXX"
            className={GeistMono.className}
            disabled={isCreating || isSubmitting}
            {...register('roomId', {
              onChange: (e) => onRoomIdChange(e, setValue),
            })}
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
          {isSubmitting && (
            <LoaderCircle className="mr-2 size-4 animate-spin" />
          )}
          {isSubmitting ? 'Joining...' : 'Join Room'}
          {!isSubmitting && <ArrowRight className="ml-2 size-4" />}
        </Button>
      </div>
    </form>
  );
};
