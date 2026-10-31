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

import { Form } from "@base-ui/react/form";
import { PlusCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import type { CreateRoomForm } from "../types";
import { NameField } from "./name-field";

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
        <h1 className="text-lg font-medium sm:text-xl" id="create-room-heading">
          Create a Room
        </h1>
        <NameField
          autoFocus
          disabled={isDisabled}
          labelClassName="text-sm font-medium sm:text-base"
        />
        <Button aria-busy={isSubmitting} disabled={isDisabled} type="submit">
          {isSubmitting ? <Spinner /> : <PlusCircleIcon aria-hidden="true" />}
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
