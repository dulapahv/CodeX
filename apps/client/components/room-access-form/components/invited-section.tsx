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

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { NAME_MAX_LENGTH } from "@/lib/constants";

import type { JoinRoomForm } from "../types";

interface InvitedSectionProps {
  error: string | null;
  isCreating: boolean;
  isSubmitting: boolean;
  onSubmit: (data: JoinRoomForm) => void;
  roomId: string;
}

export const InvitedSection = ({
  error,
  roomId,
  onSubmit,
  isSubmitting,
  isCreating,
}: InvitedSectionProps) => {
  const isDisabled = isCreating || isSubmitting;

  return (
    <section aria-label="Join Room Form">
      <Form
        className="flex flex-col gap-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const name = (formData.get("name") as string).trim();
          onSubmit({ name, roomId });
        }}
      >
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
            autoFocus
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
