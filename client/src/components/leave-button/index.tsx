import { useRef } from 'react';
import { LogOut } from 'lucide-react';

import { cn } from '@/lib/utils';
import { LeaveDialog, LeaveDialogRef } from '@/components/leave-dialog';
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

export function LeaveButton({ roomId, className }: LeaveButtonProps) {
  const leaveDialogRef = useRef<LeaveDialogRef>(null);

  const handleButtonClick = () => {
    leaveDialogRef.current?.openDialog();
  };

  const handleTooltipFocus = (e: React.FocusEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger onFocus={handleTooltipFocus} asChild>
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              `size-7 animate-swing-in-bottom-fwd rounded-sm p-0`,
              className,
            )}
            aria-label="Leave room"
            onClick={handleButtonClick}
          >
            <LogOut className="size-4 text-red-600" strokeWidth={2.5} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Leave Room</p>
        </TooltipContent>
      </Tooltip>
      <LeaveDialog ref={leaveDialogRef} roomId={roomId} />
    </>
  );
}
