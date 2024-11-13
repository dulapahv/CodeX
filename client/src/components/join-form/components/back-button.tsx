/**
 * Back button component used in the room joining flow.
 * Renders a link-styled button with an arrow icon to navigate back.
 *
 * @example
 * ```tsx
 * <BackButton
 *   onClick={() => handleBack()}
 *   disabled={isNavigating}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.onClick - Function to handle click event
 * @param props.disabled - Whether the button is disabled
 *
 * @returns A button component with left arrow icon and
 * "Back to create/join room" text
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface BackButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const BackButton = ({ onClick, disabled }: BackButtonProps) => (
  <Button
    variant="link"
    className="size-fit p-0 text-foreground"
    size="sm"
    onClick={onClick}
    disabled={disabled}
  >
    <ArrowLeft className="mr-2 size-4" />
    Back to create/join room
  </Button>
);

export { BackButton };
