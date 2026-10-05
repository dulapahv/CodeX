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

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { NAME_MAX_LENGTH } from "@/lib/constants";

import type { JoinRoomForm } from "../types";
import { onRoomIdChange } from "../utils";

interface JoinRoomSectionProps {
  defaultRoomId: string;
  error: string | null;
  isCreating: boolean;
  isSubmitting: boolean;
  onSubmit: (data: JoinRoomForm) => void;
}

export const JoinRoomSection = ({
  error,
  defaultRoomId,
  onSubmit,
  isSubmitting,
  isCreating,
}: JoinRoomSectionProps) => {
  const isDisabled = isCreating || isSubmitting;

  return (
    <section aria-labelledby="join-room-heading">
      <Form
        className="flex flex-col space-y-2 sm:space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const name = (formData.get("name") as string).trim();
          const roomId = formData.get("roomId") as string;
          onSubmit({ name, roomId });
        }}
      >
        <h1 className="font-medium text-lg sm:text-xl" id="join-room-heading">
          Join a Room
        </h1>
        <Field.Root className="flex flex-col space-y-1.5" name="roomId">
          <Field.Label className="text-sm sm:text-base">Room ID</Field.Label>
          <Input
            className="font-mono text-sm sm:text-base"
            defaultValue={defaultRoomId}
            disabled={isDisabled}
            onChange={onRoomIdChange}
            pattern="[A-Z0-9]{4}-[A-Z0-9]{4}"
            placeholder="XXXX-XXXX"
            required
          />
          <Field.Error className="text-red-500 text-sm" match="valueMissing">
            Room ID is required
          </Field.Error>
          <Field.Error className="text-red-500 text-sm" match="patternMismatch">
            Invalid room ID
          </Field.Error>
        </Field.Root>
        <Field.Root
          className="flex flex-col space-y-1.5"
          name="name"
          validate={(value) =>
            String(value).trim().length > NAME_MAX_LENGTH
              ? `Name must not exceed ${NAME_MAX_LENGTH} characters`
              : null
          }
        >
          <Field.Label className="text-sm sm:text-base">Name</Field.Label>
          <Input
            autoComplete="name"
            className="text-sm sm:text-base"
            disabled={isDisabled}
            maxLength={NAME_MAX_LENGTH}
            placeholder="Enter your name"
            required
          />
          <Field.Error className="text-red-500 text-sm" match="valueMissing">
            Name is required
          </Field.Error>
          <Field.Error className="text-red-500 text-sm" match="customError" />
        </Field.Root>
        <Button aria-busy={isSubmitting} disabled={isDisabled} type="submit">
          {isSubmitting && <Spinner />}
          {isSubmitting ? "Joining..." : "Join Room"}
          {!isSubmitting && <ArrowRight aria-hidden="true" />}
        </Button>
        {error && (
          <p className="text-destructive text-xs" role="alert">
            {error}
          </p>
        )}
      </Form>
    </section>
  );
};
