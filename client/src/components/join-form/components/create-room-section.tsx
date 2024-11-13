/**
 * CreateRoomSection component that renders the form for creating a new room.
 * Provides input field for room name and submit button with loading states.
 *
 * @component
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
 * Created by Dulapah Vibulsanti (https://dulapahv.dev).
 */

import { CirclePlus, LoaderCircle } from 'lucide-react';
import type {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { CreateRoomForm } from '../types';

interface CreateRoomSectionProps {
  register: UseFormRegister<CreateRoomForm>;
  handleSubmit: UseFormHandleSubmit<CreateRoomForm>;
  onSubmit: (data: CreateRoomForm) => Promise<void> | Promise<any>;
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
}: CreateRoomSectionProps) => (
  <form onSubmit={handleSubmit((data) => onSubmit(data), onError)}>
    <div className="flex flex-col gap-y-4">
      <h3 className="text-lg font-medium">Create a Room</h3>
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="name-create">Name</Label>
        <Input
          id="name-create"
          placeholder="Enter your name"
          disabled={isSubmitting || isJoining}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      <Button
        type="submit"
        className="bg-primary"
        disabled={isSubmitting || isJoining}
      >
        {isSubmitting ? (
          <LoaderCircle className="mr-2 size-4 animate-spin" />
        ) : (
          <CirclePlus className="mr-2 size-4" />
        )}
        {isSubmitting ? 'Creating...' : 'Create Room'}
      </Button>
    </div>
  </form>
);
