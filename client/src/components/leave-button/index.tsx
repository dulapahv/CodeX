import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { leaveRoom } from "@/lib/utils";

interface LeaveButtonProps {
  readonly roomId: string;
  readonly onLeaveSuccess?: () => void;
  readonly className?: string;
  readonly tooltipText?: string;
  readonly confirmationTitle?: string;
  readonly confirmationDescription?: string;
}

const DEFAULT_TOOLTIP = "Leave Room";
const DEFAULT_TITLE = "Are you sure you want to leave this room?";
const DEFAULT_DESCRIPTION =
  "You can always rejoin this room using the same Room ID. This room will be deleted if you are the last participant.";

/**
 * LeaveButton Component
 *
 * A button that triggers a confirmation dialog before leaving a room.
 * Includes tooltip and customizable confirmation messages.
 */
export function LeaveButton({
  roomId,
  onLeaveSuccess,
  className,
  tooltipText = DEFAULT_TOOLTIP,
  confirmationTitle = DEFAULT_TITLE,
  confirmationDescription = DEFAULT_DESCRIPTION,
}: LeaveButtonProps) {
  const router = useRouter();

  const handleLeave = () => {
    try {
      leaveRoom(roomId);
      router.push("/");
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  const handleTooltipFocus = (e: React.FocusEvent) => {
    e.preventDefault();
  };

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger onFocus={handleTooltipFocus} asChild>
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className={`size-7 rounded-sm p-0 ${className}`}
              aria-label="Leave room"
            >
              <LogOut className="size-4 text-red-600" strokeWidth={2.5} />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmationTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmationDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleLeave} asChild>
            <AlertDialogAction>Leave</AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Add prop types export for documentation
export type { LeaveButtonProps };
