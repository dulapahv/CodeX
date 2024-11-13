/**
 * InvitedSection component that renders a form for users joining via invitation link.
 * Provides input fields for name entry when joining an existing room.
 *
 * @component
 * @example
 * ```tsx
 * <InvitedSection
 *   register={register}
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
 * @param props.register - React Hook Form register function
 * @param props.handleSubmit - React Hook Form submit handler
 * @param props.onSubmit - Function called when form is submitted successfully
 * @param props.onError - Function called when form submission fails
 * @param props.errors - Form validation errors from React Hook Form
 * @param props.isSubmitting - Whether form is currently submitting
 * @param props.isCreating - Whether a new room is being created
 *
 * @returns A form section for handling room invitations
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev).
 */

import { ArrowRight, LoaderCircle } from 'lucide-react';
import type {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { JoinRoomForm } from '../types';

interface InvitedSectionProps {
  register: UseFormRegister<JoinRoomForm>;
  handleSubmit: UseFormHandleSubmit<JoinRoomForm>;
  onSubmit: (data: JoinRoomForm) => Promise<void> | Promise<any>;
  onError: () => void;
  errors: FieldErrors<JoinRoomForm>;
  isSubmitting: boolean;
  isCreating: boolean;
}

export const InvitedSection = ({
  register,
  handleSubmit,
  onSubmit,
  onError,
  errors,
  isSubmitting,
  isCreating,
}: InvitedSectionProps) => {
  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data), onError)}>
      <div className="flex flex-col gap-y-4">
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
