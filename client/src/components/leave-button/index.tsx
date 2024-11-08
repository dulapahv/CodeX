import { useRef } from "react";
import { LogOut } from "lucide-react";

import LeaveDialog from "@/components/leave-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeaveButtonProps {
  readonly roomId: string;
  readonly className?: string;
  readonly tooltipText?: string;
}

const DEFAULT_TOOLTIP = "Leave Room";

export function LeaveButton({
  roomId,
  className,
  tooltipText = DEFAULT_TOOLTIP,
}: LeaveButtonProps) {
  const leaveDialogRef = useRef<{
    openDialog: () => void;
    closeDialog: () => void;
  }>(null);

  const handleButtonClick = () => {
    leaveDialogRef.current?.openDialog();
  };

  const handleTooltipFocus = (e: React.FocusEvent) => {
    e.preventDefault();
  };

  return (
    <Tooltip>
      <TooltipTrigger onFocus={handleTooltipFocus} asChild>
        <Button
          size="icon"
          variant="ghost"
          className={`size-7 rounded-sm p-0 ${className}`}
          aria-label="Leave room"
          onClick={handleButtonClick}
        >
          <LogOut className="size-4 text-red-600" strokeWidth={2.5} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
      <LeaveDialog ref={leaveDialogRef} roomId={roomId} />
    </Tooltip>
  );
}
