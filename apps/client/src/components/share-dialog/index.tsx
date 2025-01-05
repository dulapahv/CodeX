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

import type { CopyStatus } from './types';
import { copy } from './utils';

interface ShareDialogProps {
  roomId: string;
}

interface ShareDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

const ShareDialog = forwardRef<ShareDialogRef, ShareDialogProps>(
  ({ roomId }, ref) => {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [isOpen, setIsOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<CopyStatus>({
      roomIdCopied: false,
      roomLinkCopied: false,
      qrCodeCopied: false,
    });

    const qrCodeRef = useRef<HTMLCanvasElement>(null);

    const openDialog = useCallback(() => setIsOpen(true), []);
    const closeDialog = useCallback(() => setIsOpen(false), []);

    useImperativeHandle(ref, () => ({
      openDialog,
      closeDialog,
    }));

    function handleCopy(text: string, key: keyof CopyStatus) {
      copy(text, key, setCopyStatus);
    }

    const ShareSection = ({
      label,
      value,
      copyKey,
      testId,
    }: {
      label: string;
      value: string;
      copyKey: keyof CopyStatus;
      testId: string;
    }) => (
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor={testId} className="text-sm">
          {label}
        </Label>
        <div className="flex w-full items-center gap-2 rounded-md bg-secondary p-2 md:p-3">
          <code
            id={testId}
            className="flex-1 break-all text-md font-medium sm:text-lg md:text-2xl"
            data-testid={`${testId}-text`}
          >
            {value}
          </code>
          <Button
            onClick={() => handleCopy(value, copyKey)}
            size="icon"
            variant="ghost"
            className="shrink-0 hover:bg-secondary-foreground/10 size-6 md:size-10"
            data-testid={`${testId}-copy-button`}
            aria-label={
              copyStatus[copyKey] ? `${label} copied` : `Copy ${label}`
            }
          >
            {copyStatus[copyKey] ? (
              <Check
                className="size-4 animate-scale-up-center"
                aria-hidden="true"
              />
            ) : (
              <Copy className="size-4 animate-fade-in" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    );

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
              src: '/images/kasca-logo.svg',
              height: 48,
              width: 48,
              excavate: true,
            }}
          />
        </div>

        {/* Share Sections */}
        <div className="flex flex-1 flex-col space-y-4">
          <ShareSection
            label="Room ID"
            value={roomId}
            copyKey="roomIdCopied"
            testId="room-id"
          />
          {typeof window !== 'undefined' && (
            <ShareSection
              label="Invite Link"
              value={`${window.location.origin}/room/${roomId}`}
              copyKey="roomLinkCopied"
              testId="invite-link"
            />
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
                Anyone with this Room ID or link can join and edit code in this
                room.
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
              Anyone with this Room ID or link can join and edit code in this
              room.
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
