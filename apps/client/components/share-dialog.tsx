/**
 * Share dialog component for sharing room links.
 * Features:
 * - Room link copying
 * - QR code generation
 * - Responsive dialog/drawer
 * - Copy success feedback
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { Check, Copy } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Label } from '@/components/ui/label';

interface ShareDialogProps {
  roomId: string;
}

interface ShareDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

// Separate component for Room ID copy section
const RoomIdSection = ({ roomId }: { roomId: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 500);
    } catch (error) {
      console.error('Failed to copy room ID:', error);
    }
  };

  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor="room-id" className="text-sm">
        Room ID
      </Label>
      <div className="bg-secondary flex w-full items-center gap-2 rounded-md p-2 md:p-3">
        <code
          id="room-id"
          className="text-md flex-1 break-all font-medium sm:text-lg md:text-2xl"
          data-testid="room-id-text"
        >
          {roomId}
        </code>
        <Button
          onClick={handleCopy}
          size="icon"
          variant="ghost"
          className="hover:bg-secondary-foreground/10 size-6 shrink-0 md:size-10"
          data-testid="room-id-copy-button"
          aria-label={copied ? 'Room ID copied' : 'Copy Room ID'}
        >
          {copied ? (
            <Check
              className="animate-scale-up-center size-4"
              aria-hidden="true"
            />
          ) : (
            <Copy className="animate-fade-in size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
};

// Separate component for Invite Link copy section
const InviteLinkSection = ({ roomId }: { roomId: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const inviteLink = `${window.location.origin}/room/${roomId}`;
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy invite link:', error);
    }
  };

  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor="invite-link" className="text-sm">
        Invite Link
      </Label>
      <div className="bg-secondary flex w-full items-center gap-2 rounded-md p-2 md:p-3">
        <code
          id="invite-link"
          className="text-md flex-1 break-all font-medium sm:text-lg md:text-2xl"
          data-testid="invite-link-text"
        >
          {`${window.location.origin}/room/${roomId}`}
        </code>
        <Button
          onClick={handleCopy}
          size="icon"
          variant="ghost"
          className="hover:bg-secondary-foreground/10 size-6 shrink-0 md:size-10"
          data-testid="invite-link-copy-button"
          aria-label={copied ? 'Invite link copied' : 'Copy invite link'}
        >
          {copied ? (
            <Check
              className="animate-scale-up-center size-4"
              aria-hidden="true"
            />
          ) : (
            <Copy className="animate-fade-in size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
};

const ShareDialog = forwardRef<ShareDialogRef, ShareDialogProps>(
  ({ roomId }, ref) => {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [isOpen, setIsOpen] = useState(false);
    const qrCodeRef = useRef<HTMLCanvasElement>(null);

    const openDialog = useCallback(() => setIsOpen(true), []);
    const closeDialog = useCallback(() => setIsOpen(false), []);

    useImperativeHandle(ref, () => ({
      openDialog,
      closeDialog,
    }));

    const content = (
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        {/* QR Code Section */}
        <div
          className="flex shrink-0 justify-center md:sticky md:top-0"
          data-testid="qr-code"
        >
          <QRCodeCanvas
            ref={qrCodeRef}
            value={`${window.location.origin}/room/${roomId}`}
            title={`QR code to join room ${roomId}`}
            size={Math.min(256, window.innerWidth - 96)}
            marginSize={2}
            className="rounded-lg"
            imageSettings={{
              src: '/images/codex-logo.svg',
              height: 48,
              width: 48,
              excavate: true,
            }}
          />
        </div>

        {/* Share Sections */}
        <div className="flex flex-1 flex-col space-y-4">
          <RoomIdSection roomId={roomId} />
          {typeof window !== 'undefined' && (
            <InviteLinkSection roomId={roomId} />
          )}
        </div>
      </div>
    );

    if (isDesktop) {
      return (
        <Dialog
          open={isOpen}
          onOpenChange={setIsOpen}
          aria-label="Share room dialog"
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Share Room</DialogTitle>
              <DialogDescription>
                Anyone with this Room ID or Invite Link can collaborate in this
                room. Only share with people you trust.
              </DialogDescription>
            </DialogHeader>
            {content}
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="secondary" aria-label="Close share dialog">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer
        open={isOpen}
        onOpenChange={setIsOpen}
        aria-label="Share room drawer"
      >
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Share Room</DrawerTitle>
            <DrawerDescription>
              Anyone with this Room ID or Invite Link can collaborate in this
              room. Only share with people you trust.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">{content}</div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="secondary" aria-label="Close share drawer">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  },
);

ShareDialog.displayName = 'ShareDialog';

export { ShareDialog, type ShareDialogRef };
