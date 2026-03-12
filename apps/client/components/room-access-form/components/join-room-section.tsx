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

import * as Form from "@radix-ui/react-form";
import { ArrowRight } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NAME_MAX_LENGTH } from "@/lib/constants";

import type { JoinRoomForm } from "../types";
import { onRoomIdChange } from "../utils";

interface JoinRoomSectionProps {
  defaultRoomId: string;
  isCreating: boolean;
  isSubmitting: boolean;
  onSubmit: (data: JoinRoomForm) => void;
}

export const JoinRoomSection = ({
  defaultRoomId,
  onSubmit,
  isSubmitting,
  isCreating,
}: JoinRoomSectionProps) => {
  const isDisabled = isCreating || isSubmitting;

  return (
    <section aria-labelledby="join-room-heading">
      <Form.Root
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
        <Form.Field className="flex flex-col space-y-1.5" name="roomId">
          <Form.Label className="text-sm sm:text-base">Room ID</Form.Label>
          <Form.Control asChild>
            <Input
              className="font-mono text-sm sm:text-base"
              defaultValue={defaultRoomId}
              disabled={isDisabled}
              onChange={onRoomIdChange}
              pattern="[A-Z0-9]{4}-[A-Z0-9]{4}"
              placeholder="XXXX-XXXX"
              required
            />
          </Form.Control>
          <Form.Message className="text-red-500 text-sm" match="valueMissing">
            Room ID is required
          </Form.Message>
          <Form.Message
            className="text-red-500 text-sm"
            match="patternMismatch"
          >
            Invalid room ID
          </Form.Message>
        </Form.Field>
        <Form.Field className="flex flex-col space-y-1.5" name="name">
          <Form.Label className="text-sm sm:text-base">Name</Form.Label>
          <Form.Control asChild>
            <Input
              autoComplete="name"
              className="text-sm sm:text-base"
              disabled={isDisabled}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Enter your name"
              required
            />
          </Form.Control>
          <Form.Message className="text-red-500 text-sm" match="valueMissing">
            Name is required
          </Form.Message>
          <Form.Message
            className="text-red-500 text-sm"
            match={(value) => value.trim().length > NAME_MAX_LENGTH}
          >
            {`Name must not exceed ${NAME_MAX_LENGTH} characters`}
          </Form.Message>
        </Form.Field>
        <Form.Submit asChild>
          <Button
            aria-busy={isSubmitting}
            className="bg-primary text-sm sm:text-base"
            disabled={isDisabled}
          >
            {isSubmitting && <Spinner className="mr-2 size-4 sm:size-5" />}
            {isSubmitting ? "Joining..." : "Join Room"}
            {!isSubmitting && (
              <ArrowRight
                aria-hidden="true"
                className="ml-2 size-4 sm:size-5"
              />
            )}
          </Button>
        </Form.Submit>
      </Form.Root>
    </section>
  );
};
