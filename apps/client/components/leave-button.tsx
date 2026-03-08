/**
 * Navigation button component that handles room leaving confirmation.
 * Features:
 * - Dialog trigger
 * - Accessible controls
 * - Styling customization
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { LogOut } from "lucide-react";
import { type FocusEvent, useRef } from "react";
import { LeaveDialog, type LeaveDialogRef } from "@/components/leave-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
        <TooltipTrigger asChild onFocus={handleTooltipFocus}>
          <Button
            aria-expanded="false"
            aria-haspopup="dialog"
            aria-label="Leave room"
            className={cn(
              "size-7 animate-fade-in-top rounded-sm p-0",
              className
            )}
            onClick={handleButtonClick}
            size="icon"
            variant="ghost"
          >
            <LogOut
              aria-hidden="true"
              className="size-4 text-red-600"
              strokeWidth={2.5}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          aria-label="Leave Room"
          className="mr-1"
          role="tooltip"
          sideOffset={8}
        >
          <p>Leave Room</p>
        </TooltipContent>
      </Tooltip>
      <LeaveDialog aria-label="Confirm leaving room" ref={leaveDialogRef} />
    </>
  );
};

export { LeaveButton };
