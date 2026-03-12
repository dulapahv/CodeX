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

import * as Form from "@radix-ui/react-form";
import { CirclePlus } from "lucide-react";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NAME_MAX_LENGTH } from "@/lib/constants";

import type { CreateRoomForm } from "../types";

interface CreateRoomSectionProps {
  isJoining: boolean;
  isSubmitting: boolean;
  onSubmit: (data: CreateRoomForm) => void;
}

export const CreateRoomSection = ({
  onSubmit,
  isSubmitting,
  isJoining,
}: CreateRoomSectionProps) => {
  const isDisabled = isSubmitting || isJoining;

  return (
    <section aria-labelledby="create-room-heading">
      <Form.Root
        className="flex flex-col space-y-2 sm:space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const name = (formData.get("name") as string).trim();
          onSubmit({ name });
        }}
      >
        <h1 className="font-medium text-lg sm:text-xl" id="create-room-heading">
          Create a Room
        </h1>
        <Form.Field className="flex flex-col space-y-1.5" name="name">
          <Form.Label className="font-medium text-sm sm:text-base">
            Name
          </Form.Label>
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
            {isSubmitting ? (
              <Spinner className="mr-2 size-4 sm:size-5" />
            ) : (
              <CirclePlus
                aria-hidden="true"
                className="mr-2 size-4 sm:size-5"
              />
            )}
            {isSubmitting ? "Creating..." : "Create Room"}
          </Button>
        </Form.Submit>
      </Form.Root>
    </section>
  );
};
