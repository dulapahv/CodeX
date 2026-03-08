/**
 * Room joining form section component for invited users.
 * Features:
 * - Name input validation
 * - Submit handling
 * - Loading states
 * - Error display
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ArrowRight } from "lucide-react";
import type {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from "react-hook-form";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { JoinRoomForm } from "../types";

interface InvitedSectionProps {
  errors: FieldErrors<JoinRoomForm>;
  handleSubmit: UseFormHandleSubmit<JoinRoomForm>;
  isCreating: boolean;
  isSubmitting: boolean;
  onError: () => void;
  onSubmit: (data: JoinRoomForm) => Promise<boolean> | undefined;
  register: UseFormRegister<JoinRoomForm>;
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
  const isDisabled = isCreating || isSubmitting;
  const nameErrorId = "invited-name-error";

  return (
    <section aria-label="Join Room Form">
      <form
        className="flex flex-col gap-y-4"
        noValidate
        onSubmit={handleSubmit((data) => onSubmit(data), onError)}
      >
        <fieldset
          aria-labelledby="name-join"
          className="flex flex-col space-y-1.5"
        >
          <Label className="text-sm sm:text-base" htmlFor="name-join">
            Name
          </Label>
          <Input
            aria-describedby={errors.name ? nameErrorId : undefined}
            aria-invalid={errors.name ? "true" : "false"}
            aria-required="true"
            className="text-sm sm:text-base"
            disabled={isDisabled}
            id="name-join"
            placeholder="Enter your name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-red-500 text-sm" id={nameErrorId} role="alert">
              {errors.name.message}
            </p>
          )}
        </fieldset>
        <Button
          aria-busy={isSubmitting}
          className="bg-primary text-sm sm:text-base"
          disabled={isDisabled}
          type="submit"
        >
          {isSubmitting && <Spinner className="mr-2 size-4 sm:size-5" />}
          {isSubmitting ? "Joining..." : "Join Room"}
          {!isSubmitting && (
            <ArrowRight aria-hidden="true" className="ml-2 size-4 sm:size-5" />
          )}
        </Button>
      </form>
    </section>
  );
};
