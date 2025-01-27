/**
 * Navigation button component that handles room leaving confirmation.
 * Features:
 * - Dialog trigger
 * - Accessible controls
 * - Styling customization
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { FocusEvent, useRef } from 'react';

import { LogOut } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LeaveDialog, type LeaveDialogRef } from '@/components/leave-dialog';

interface LeaveButtonProps {
  readonly className?: string;
}

const LeaveButton = ({ className }: LeaveButtonProps) => {
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
              'animate-fade-in-top size-7 rounded-sm p-0',
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
