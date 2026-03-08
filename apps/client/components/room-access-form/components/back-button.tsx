/**
 * Back button component that navigates back to room creation/joining.
 * Features:
 * - Click handling
 * - Disabled state support
 * - Accessible button with label
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BackButtonProps {
  disabled: boolean;
  onClick: () => void;
}

const BackButton = ({ onClick, disabled }: BackButtonProps) => (
  <Button
    aria-label="Back to create or join room page"
    className="size-fit p-0 text-foreground"
    disabled={disabled}
    onClick={onClick}
    size="sm"
    variant="link"
  >
    <ArrowLeft aria-hidden="true" className="mr-2 size-4" />
    <span>Back to create/join room</span>
  </Button>
);

export { BackButton };
