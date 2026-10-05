/**
 * Share button component that provides room sharing functionality.
 * Features:
 * - Share dialog trigger
 * - Accessible tooltip
 * - Room ID handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Share } from "lucide-react";
import { useRef } from "react";
import { ShareDialog, type ShareDialogRef } from "@/components/share-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoomProps {
  roomId: string;
}

const ShareButton = ({ roomId }: RoomProps) => {
  const shareDialogRef = useRef<ShareDialogRef>(null);

  const handleButtonClick = () => {
    shareDialogRef.current?.openDialog();
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-haspopup="dialog"
              aria-label="Share this coding room"
              className="hover:!text-foreground aspect-square h-7 animate-fade-in-top p-1 text-[color:var(--toolbar-foreground)] sm:aspect-auto sm:px-1"
              onClick={handleButtonClick}
              size="sm"
              variant="ghost"
            >
              <Share aria-hidden="true" className="size-4" />
              <span className="hidden sm:flex">Share</span>
            </Button>
          }
        />
        <TooltipContent role="tooltip" sideOffset={8}>
          <p>Share this room with others</p>
        </TooltipContent>
      </Tooltip>
      <ShareDialog
        aria-label="Share room options"
        ref={shareDialogRef}
        roomId={roomId}
      />
    </>
  );
};

export { ShareButton };
