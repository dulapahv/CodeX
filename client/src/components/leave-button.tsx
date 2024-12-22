/**
 * LeaveButton component that renders a button to leave the current room.
 * Shows a confirmation dialog before leaving.
 *
 * @example
 * ```tsx
 * <LeaveButton
 *   roomId="abc123"
 *   className="custom-class"
 * />
 * ```
 *
 * @param props - Component props
 * @param props.roomId - ID of the current room
 * @param props.className - Optional CSS class name for styling
 *
 * @remarks
 * Uses the following components:
 * - [`LeaveDialog`](src/components/leave-dialog/index.tsx) for confirmation
 * - [`Button`](src/components/ui/button.tsx) for the UI
 * - [`Tooltip`](src/components/ui/tooltip.tsx) for hover state
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { FocusEvent, useRef } from 'react';
import { LogOut } from 'lucide-react';

import { cn } from '@/lib/utils';
import { LeaveDialog, type LeaveDialogRef } from '@/components/leave-dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LeaveButtonProps {
  readonly roomId: string;
  readonly className?: string;
}

const LeaveButton = ({ roomId, className }: LeaveButtonProps) => {
  const leaveDialogRef = useRef<LeaveDialogRef>(null);

  const handleButtonClick = () => {
    leaveDialogRef.current?.openDialog();
  };

  const handleTooltipFocus = (e: FocusEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger onFocus={handleTooltipFocus} asChild>
          <Button
            aria-label="Leave room"
            aria-haspopup="dialog"
            aria-expanded="false"
            size="icon"
            variant="ghost"
            className={cn(
              `size-7 animate-fade-in-top rounded-sm p-0`,
              className,
            )}
            onClick={handleButtonClick}
          >
            <LogOut
              className="size-4 text-red-600"
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          role="tooltip"
          aria-label="Leave Room"
          sideOffset={8}
          className="mr-1"
        >
          <p>Leave Room</p>
        </TooltipContent>
      </Tooltip>
      <LeaveDialog ref={leaveDialogRef} aria-label="Confirm leaving room" />
    </>
  );
};

export { LeaveButton };
