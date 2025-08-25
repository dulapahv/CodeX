/**
 * Share button component that provides room sharing functionality.
 * Features:
 * - Share dialog trigger
 * - Accessible tooltip
 * - Room ID handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useRef } from 'react';

import { Share } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ShareDialog, ShareDialogRef } from '@/components/share-dialog';

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
      <Dialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="animate-fade-in-top hover:!text-foreground aspect-square h-7 rounded-sm p-1
                text-[color:var(--toolbar-foreground)] sm:aspect-auto sm:px-1"
              aria-label="Share this coding room"
              aria-haspopup="dialog"
              aria-expanded="false"
              onClick={handleButtonClick}
            >
              <Share className="mr-0 size-4 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:flex">Share</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent role="tooltip" sideOffset={8}>
            <p>Share this room with others</p>
          </TooltipContent>
        </Tooltip>
      </Dialog>
      <ShareDialog
        ref={shareDialogRef}
        roomId={roomId}
        aria-label="Share room options"
      />
    </>
  );
};

export { ShareButton };
