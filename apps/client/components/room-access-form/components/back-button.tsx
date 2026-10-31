/**
 * Back button component that navigates back to room creation/joining.
 * Features:
 * - Click handling
 * - Disabled state support
 * - Accessible button with label
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ArrowLeftIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

interface BackButtonProps {
  disabled: boolean;
  onClick: () => void;
}

const BackButton = ({ onClick, disabled }: BackButtonProps) => (
  <Button
    aria-label="Back to create or join room page"
    className="text-foreground size-fit p-0"
    disabled={disabled}
    onClick={onClick}
    size="sm"
    variant="link"
  >
    <ArrowLeftIcon aria-hidden="true" className="size-4" />
    <span>Back to create/join room</span>
  </Button>
);

export { BackButton };
