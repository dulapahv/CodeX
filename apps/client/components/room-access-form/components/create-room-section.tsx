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

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { CirclePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { NAME_MAX_LENGTH } from "@/lib/constants";

import type { CreateRoomForm } from "../types";

interface CreateRoomSectionProps {
  error: string | null;
  isJoining: boolean;
  isSubmitting: boolean;
  onSubmit: (data: CreateRoomForm) => void;
}

export const CreateRoomSection = ({
  error,
  onSubmit,
  isSubmitting,
  isJoining,
}: CreateRoomSectionProps) => {
  const isDisabled = isSubmitting || isJoining;

  return (
    <section aria-labelledby="create-room-heading">
      <Form
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
        <Field.Root
          className="flex flex-col space-y-1.5"
          name="name"
          validate={(value) =>
            String(value).trim().length > NAME_MAX_LENGTH
              ? `Name must not exceed ${NAME_MAX_LENGTH} characters`
              : null
          }
        >
          <Field.Label className="font-medium text-sm sm:text-base">
            Name
          </Field.Label>
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
          {isSubmitting ? <Spinner /> : <CirclePlus aria-hidden="true" />}
          {isSubmitting ? "Creating..." : "Create Room"}
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
