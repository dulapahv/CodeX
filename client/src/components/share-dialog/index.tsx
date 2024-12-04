import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { GeistMono } from 'geist/font/mono';
import { Check, Copy, Image as LuImage } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

import { cn } from '@/lib/utils';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { CopyStatus } from './types';
import { copy, copyQRCode } from './utils';

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
    const [activeTab, setActiveTab] = useState('links');
    const [copyStatus, setCopyStatus] = useState<CopyStatus>({
      roomIdCopied: false,
      roomLinkCopied: false,
      qrCodeCopied: false,
    });

    const qrCodeRef = useRef<HTMLCanvasElement>(null);

    const openDialog = useCallback(() => setIsOpen(true), []);
    const closeDialog = useCallback(() => setIsOpen(false), []);

    // Expose openDialog and closeDialog to the parent component
    useImperativeHandle(ref, () => ({
      openDialog,
      closeDialog,
    }));

    function handleCopy(text: string, key: keyof CopyStatus) {
      copy(text, key, setCopyStatus);
    }

    function handleCopyQRCode() {
      copyQRCode(qrCodeRef, setCopyStatus);
    }

    const content = (
      <div className="flex h-full flex-col">
        <Tabs
          defaultValue="links"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
          aria-label="Share options"
        >
          <TabsList
            className="grid w-full grid-cols-2"
            aria-label="Share methods"
          >
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>

          <TabsContent
            value="links"
            className="mt-4 space-y-4"
            role="tabpanel"
            aria-label="Share via links"
          >
            {/* Room ID Section */}
            <div className="space-y-1.5">
              <Label htmlFor="room-id" className="text-sm font-medium">
                Room ID
              </Label>
              <div className="flex gap-x-2">
                <Input
                  id="room-id"
                  value={roomId}
                  readOnly
                  className={cn('text-sm', GeistMono.className)}
                  aria-label="Room ID for sharing"
                />
                <Button
                  onClick={() => handleCopy(roomId, 'roomIdCopied')}
                  size="icon"
                  variant="secondary"
                  className="shrink-0"
                  aria-label={
                    copyStatus.roomIdCopied ? 'Room ID copied' : 'Copy Room ID'
                  }
                >
                  {copyStatus.roomIdCopied ? (
                    <Check
                      className="size-4 animate-scale-up-center"
                      aria-hidden="true"
                    />
                  ) : (
                    <Copy
                      className="size-4 animate-fade-in"
                      aria-hidden="true"
                    />
                  )}
                </Button>
              </div>
            </div>

            {/* Room Link Section */}
            <div className="space-y-1.5">
              <Label htmlFor="room-link" className="text-sm font-medium">
                Room Link
              </Label>
              <div className="flex gap-x-2">
                {typeof window !== 'undefined' && (
                  <Input
                    id="room-link"
                    value={`${window.location.origin}/room/${roomId}`}
                    readOnly
                    className={cn('text-sm', GeistMono.className)}
                    aria-label="Shareable room link"
                  />
                )}
                <Button
                  onClick={() =>
                    handleCopy(
                      `${window.location.origin}/room/${roomId}`,
                      'roomLinkCopied',
                    )
                  }
                  size="icon"
                  variant="secondary"
                  className="shrink-0"
                  aria-label={
                    copyStatus.roomLinkCopied
                      ? 'Room link copied'
                      : 'Copy room link'
                  }
                >
                  {copyStatus.roomLinkCopied ? (
                    <Check
                      className="size-4 animate-scale-up-center"
                      aria-hidden="true"
                    />
                  ) : (
                    <Copy
                      className="size-4 animate-fade-in"
                      aria-hidden="true"
                    />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="qr"
            className="mt-4"
            role="tabpanel"
            aria-label="Share via QR code"
          >
            <div className="flex flex-col items-center space-y-4">
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
              <Button
                onClick={handleCopyQRCode}
                size="sm"
                variant="secondary"
                className="w-full sm:w-auto"
                aria-label={
                  copyStatus.qrCodeCopied
                    ? 'QR code copied as image'
                    : 'Copy QR code as image'
                }
              >
                {copyStatus.qrCodeCopied ? (
                  <Check
                    className="mr-2 size-4 animate-scale-up-center"
                    aria-hidden="true"
                  />
                ) : (
                  <LuImage
                    className="mr-2 size-4 animate-fade-in"
                    aria-hidden="true"
                  />
                )}
                <span>Copy QR Code</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );

    if (isDesktop) {
      return (
        <Dialog
          open={isOpen}
          onOpenChange={setIsOpen}
          aria-label="Share room dialog"
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Share Room</DialogTitle>
              <DialogDescription>
                Anyone with this Room ID or link can join and edit code in this
                room.
              </DialogDescription>
            </DialogHeader>
            {content}
            <DialogFooter className="mt-4">
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
