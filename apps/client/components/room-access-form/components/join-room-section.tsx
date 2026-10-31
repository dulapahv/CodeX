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
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import type { JoinRoomForm } from "../types";
import { onRoomIdChange } from "../utils";
import { NameField } from "./name-field";

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
        <h1 className="text-lg font-medium sm:text-xl" id="join-room-heading">
          Join a Room
        </h1>
        <Field.Root className="flex flex-col space-y-1.5" name="roomId">
          {/* biome-ignore lint/a11y/noLabelWithoutControl: Base UI ties Field.Label to the field's control */}
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
          <Field.Error className="text-sm text-red-500" match="valueMissing">
            Room ID is required
          </Field.Error>
          <Field.Error className="text-sm text-red-500" match="patternMismatch">
            Invalid room ID
          </Field.Error>
        </Field.Root>
        <NameField disabled={isDisabled} />
        <Button aria-busy={isSubmitting} disabled={isDisabled} type="submit">
          {isSubmitting && <Spinner />}
          {isSubmitting ? "Joining..." : "Join Room"}
          {!isSubmitting && <ArrowRightIcon aria-hidden="true" />}
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
