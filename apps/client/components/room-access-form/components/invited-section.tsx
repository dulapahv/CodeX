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

import { Form } from "@base-ui/react/form";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import type { JoinRoomForm } from "../types";
import { NameField } from "./name-field";

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
        <NameField autoFocus disabled={isDisabled} />
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
