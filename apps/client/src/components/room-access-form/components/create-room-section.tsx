/**
 * CreateRoomSection component that renders the form for creating a new room.
 * Provides input field for room name and submit button with loading states.
 *
 * @example
 * ```tsx
 * <CreateRoomSection
 *   register={register}
 *   handleSubmit={handleSubmit}
 *   onSubmit={handleCreateRoom}
 *   onError={handleError}
 *   errors={errors}
 *   isSubmitting={isSubmitting}
 *   isJoining={isJoining}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.register - React Hook Form register function for form fields
 * @param props.handleSubmit - React Hook Form submit handler
 * @param props.onSubmit - Function called when form is submitted successfully
 * @param props.onError - Function called when form submission fails
 * @param props.errors - Form validation errors from React Hook Form
 * @param props.isSubmitting - Whether form is currently submitting
 * @param props.isJoining - Whether user is currently joining a room
 *
 * @returns A form section with name input and create button
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { CirclePlus } from 'lucide-react';
import type {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/spinner';

import type { CreateRoomForm } from '../types';

interface CreateRoomSectionProps {
  register: UseFormRegister<CreateRoomForm>;
  handleSubmit: UseFormHandleSubmit<CreateRoomForm>;
  onSubmit: (data: CreateRoomForm) => Promise<string> | undefined;
  onError: () => void;
  errors: FieldErrors<CreateRoomForm>;
  isSubmitting: boolean;
  isJoining: boolean;
}

export const CreateRoomSection = ({
  register,
  handleSubmit,
  onSubmit,
  onError,
  errors,
  isSubmitting,
  isJoining,
}: CreateRoomSectionProps) => {
  const isDisabled = isSubmitting || isJoining;
  const inputId = 'name-create';
  const errorId = 'name-error';

  return (
    <section aria-labelledby="create-room-heading">
      <form
        onSubmit={handleSubmit((data) => onSubmit(data), onError)}
        className="flex flex-col space-y-2 sm:space-y-4"
        noValidate
      >
        <h3 id="create-room-heading" className="text-lg font-medium sm:text-xl">
          Create a Room
        </h3>
        <div
          className="flex flex-col space-y-1.5"
          role="group"
          aria-labelledby={inputId}
        >
          <Label htmlFor={inputId} className="text-sm font-medium sm:text-base">
            Name
          </Label>
          <Input
            id={inputId}
            placeholder="Enter your name"
            className="text-sm sm:text-base"
            disabled={isDisabled}
            aria-required="true"
            aria-invalid={errors.name ? 'true' : 'false'}
            aria-describedby={errors.name ? errorId : undefined}
            {...register('name')}
          />
          {errors.name && (
            <p id={errorId} className="text-sm text-red-500" role="alert">
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
          {isSubmitting ? (
            <Spinner className="mr-2 size-4 sm:size-5" />
          ) : (
            <CirclePlus className="mr-2 size-4 sm:size-5" aria-hidden="true" />
          )}
          {isSubmitting ? 'Creating...' : 'Create Room'}
        </Button>
      </form>
    </section>
  );
};
