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

import * as Form from "@radix-ui/react-form";
import { ArrowRight } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NAME_MAX_LENGTH } from "@/lib/constants";

import type { JoinRoomForm } from "../types";

interface InvitedSectionProps {
  isCreating: boolean;
  isSubmitting: boolean;
  onSubmit: (data: JoinRoomForm) => void;
  roomId: string;
}

export const InvitedSection = ({
  roomId,
  onSubmit,
  isSubmitting,
  isCreating,
}: InvitedSectionProps) => {
  const isDisabled = isCreating || isSubmitting;

  return (
    <section aria-label="Join Room Form">
      <Form.Root
        className="flex flex-col gap-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const name = (formData.get("name") as string).trim();
          onSubmit({ name, roomId });
        }}
      >
        <Form.Field className="flex flex-col space-y-1.5" name="name">
          <Form.Label className="text-sm sm:text-base">Name</Form.Label>
          <Form.Control asChild>
            <Input
              autoComplete="name"
              autoFocus
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
