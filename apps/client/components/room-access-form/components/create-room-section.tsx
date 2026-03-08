/**
 * Create room section component that provides room creation form.
 * Features:
 * - Name input validation
 * - Submit handling
 * - Loading states
 * - Error display
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { CirclePlus } from "lucide-react";
import type {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from "react-hook-form";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { CreateRoomForm } from "../types";

interface CreateRoomSectionProps {
  errors: FieldErrors<CreateRoomForm>;
  handleSubmit: UseFormHandleSubmit<CreateRoomForm>;
  isJoining: boolean;
  isSubmitting: boolean;
  onError: () => void;
  onSubmit: (data: CreateRoomForm) => Promise<string> | undefined;
  register: UseFormRegister<CreateRoomForm>;
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
  const inputId = "name-create";
  const errorId = "name-error";

  return (
    <section aria-labelledby="create-room-heading">
      <form
        className="flex flex-col space-y-2 sm:space-y-4"
        noValidate
        onSubmit={handleSubmit((data) => onSubmit(data), onError)}
      >
        <h1 className="font-medium text-lg sm:text-xl" id="create-room-heading">
          Create a Room
        </h1>
        <fieldset
          aria-labelledby={inputId}
          className="flex flex-col space-y-1.5"
        >
          <Label className="font-medium text-sm sm:text-base" htmlFor={inputId}>
            Name
          </Label>
          <Input
            aria-describedby={errors.name ? errorId : undefined}
            aria-invalid={errors.name ? "true" : "false"}
            aria-required="true"
            className="text-sm sm:text-base"
            disabled={isDisabled}
            id={inputId}
            placeholder="Enter your name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-red-500 text-sm" id={errorId} role="alert">
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
          {isSubmitting ? (
            <Spinner className="mr-2 size-4 sm:size-5" />
          ) : (
            <CirclePlus aria-hidden="true" className="mr-2 size-4 sm:size-5" />
          )}
          {isSubmitting ? "Creating..." : "Create Room"}
        </Button>
      </form>
    </section>
  );
};
