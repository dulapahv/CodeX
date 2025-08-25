/**
 * Room joining form section component that provides room joining functionality.
 * Features:
 * - Room ID validation
 * - Name input validation
 * - Submit handling
 * - Loading states
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ArrowRight } from 'lucide-react';
import type {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/spinner';

import type { JoinRoomForm } from '../types';
import { onRoomIdChange } from '../utils';

interface JoinRoomSectionProps {
  register: UseFormRegister<JoinRoomForm>;
  setValue: UseFormSetValue<JoinRoomForm>;
  handleSubmit: UseFormHandleSubmit<JoinRoomForm>;
  onSubmit: (data: JoinRoomForm) => Promise<boolean> | undefined;
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
  const isDisabled = isCreating || isSubmitting;
  const roomIdErrorId = 'room-id-error';
  const nameErrorId = 'name-join-error';

  return (
    <section aria-labelledby="join-room-heading">
      <form
        onSubmit={handleSubmit((data) => onSubmit(data), onError)}
        className="flex flex-col space-y-2 sm:space-y-4"
        noValidate
      >
        <h1 id="join-room-heading" className="text-lg font-medium sm:text-xl">
          Join a Room
        </h1>
        <div
          className="flex flex-col space-y-1.5"
          role="group"
          aria-labelledby="room-id"
        >
          <Label htmlFor="room-id" className="text-sm sm:text-base">
            Room ID
          </Label>
          <Input
            id="room-id"
            placeholder="XXXX-XXXX"
            className="font-mono text-sm sm:text-base"
            disabled={isDisabled}
            aria-required="true"
            aria-invalid={errors.roomId ? 'true' : 'false'}
            aria-describedby={errors.roomId ? roomIdErrorId : undefined}
            {...register('roomId', {
              onChange: (e) => onRoomIdChange(e, setValue),
            })}
          />
          {errors.roomId && (
            <p id={roomIdErrorId} className="text-sm text-red-500" role="alert">
              {errors.roomId.message}
            </p>
          )}
        </div>
        <div
          className="flex flex-col space-y-1.5"
          role="group"
          aria-labelledby="name-join"
        >
          <Label htmlFor="name-join" className="text-sm sm:text-base">
            Name
          </Label>
          <Input
            id="name-join"
            placeholder="Enter your name"
            className="text-sm sm:text-base"
            disabled={isDisabled}
            aria-required="true"
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? nameErrorId : undefined}
            {...register('name')}
          />
          {errors.name && (
            <p id={nameErrorId} className="text-sm text-red-500" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="bg-primary text-sm sm:text-base"
          disabled={isDisabled}
          aria-busy={isSubmitting}
        >
          {isSubmitting && <Spinner className="mr-2 size-4 sm:size-5" />}
          {isSubmitting ? 'Joining...' : 'Join Room'}
          {!isSubmitting && (
            <ArrowRight className="ml-2 size-4 sm:size-5" aria-hidden="true" />
          )}
        </Button>
      </form>
    </section>
  );
};
