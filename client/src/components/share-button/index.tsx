import { useRef } from 'react';
import { Share } from 'lucide-react';

import { ShareDialog, ShareDialogRef } from '@/components/share-dialog';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
              className="h-7 animate-swing-in-bottom-fwd rounded-sm px-2"
              aria-label="Share room"
              onClick={handleButtonClick}
            >
              <Share className="mr-2 size-4" />
              Share
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share Room</p>
          </TooltipContent>
        </Tooltip>
      </Dialog>
      <ShareDialog ref={shareDialogRef} roomId={roomId} />
    </>
  );
};

export { ShareButton };
