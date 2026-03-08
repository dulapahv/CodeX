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

import { ArrowRight } from "lucide-react";
import type {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { JoinRoomForm } from "../types";
import { onRoomIdChange } from "../utils";

interface JoinRoomSectionProps {
  errors: FieldErrors<JoinRoomForm>;
  handleSubmit: UseFormHandleSubmit<JoinRoomForm>;
  isCreating: boolean;
  isSubmitting: boolean;
  onError: () => void;
  onSubmit: (data: JoinRoomForm) => Promise<boolean> | undefined;
  register: UseFormRegister<JoinRoomForm>;
  setValue: UseFormSetValue<JoinRoomForm>;
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
  const roomIdErrorId = "room-id-error";
  const nameErrorId = "name-join-error";

  return (
    <section aria-labelledby="join-room-heading">
      <form
        className="flex flex-col space-y-2 sm:space-y-4"
        noValidate
        onSubmit={handleSubmit((data) => onSubmit(data), onError)}
      >
        <h1 className="font-medium text-lg sm:text-xl" id="join-room-heading">
          Join a Room
        </h1>
        <fieldset
          aria-labelledby="room-id"
          className="flex flex-col space-y-1.5"
        >
          <Label className="text-sm sm:text-base" htmlFor="room-id">
            Room ID
          </Label>
          <Input
            aria-describedby={errors.roomId ? roomIdErrorId : undefined}
            aria-invalid={errors.roomId ? "true" : "false"}
            aria-required="true"
            className="font-mono text-sm sm:text-base"
            disabled={isDisabled}
            id="room-id"
            placeholder="XXXX-XXXX"
            {...register("roomId", {
              onChange: (e) => onRoomIdChange(e, setValue),
            })}
          />
          {errors.roomId && (
            <p className="text-red-500 text-sm" id={roomIdErrorId} role="alert">
              {errors.roomId.message}
            </p>
          )}
        </fieldset>
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
