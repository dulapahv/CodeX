import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { Check, Copy, Image as LuImage } from 'lucide-react';
import QRCode from 'react-qr-code';

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
    const [isOpen, setIsOpen] = useState(false);

    const isDesktop = useMediaQuery('(min-width: 768px)');

    const [copyStatus, setCopyStatus] = useState<CopyStatus>({
      roomIdCopied: false,
      roomLinkCopied: false,
      qrCodeCopied: false,
    });

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
      copyQRCode(setCopyStatus);
    }

    const content = (
      <div className="flex h-full flex-col">
        <Tabs defaultValue="links" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="qr">QR Code</TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="mt-4 space-y-4">
            {/* Room ID Section */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Room ID</Label>
              <div className="flex gap-x-2">
                <Input value={roomId} readOnly className="font-mono text-sm" />
                <Button
                  onClick={() => handleCopy(roomId, 'roomIdCopied')}
                  size="icon"
                  variant="secondary"
                  className="shrink-0"
                >
                  {copyStatus.roomIdCopied ? (
                    <Check className="size-4 animate-scale-up-center" />
                  ) : (
                    <Copy className="size-4 animate-fade-in" />
                  )}
                </Button>
              </div>
            </div>

            {/* Room Link Section */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Room Link</Label>
              <div className="flex gap-x-2">
                {typeof window !== 'undefined' && (
                  <Input
                    value={`${window.location.origin}/room/${roomId}`}
                    readOnly
                    className="font-mono text-sm"
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
                >
                  {copyStatus.roomLinkCopied ? (
                    <Check className="size-4 animate-scale-up-center" />
                  ) : (
                    <Copy className="size-4 animate-fade-in" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qr" className="mt-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-lg bg-white p-4">
                <QRCode
                  value={`${window.location.origin}/room/${roomId}`}
                  size={Math.min(256, window.innerWidth - 96)}
                  id="qr-code"
                />
              </div>
              <Button
                onClick={handleCopyQRCode}
                size="sm"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                {copyStatus.qrCodeCopied ? (
                  <Check className="mr-2 size-4 animate-scale-up-center" />
                ) : (
                  <LuImage className="mr-2 size-4 animate-fade-in" />
                )}
                Copy QR Code as Image
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );

    if (isDesktop) {
      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                <Button variant="secondary">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
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
              <Button variant="secondary">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  },
);

ShareDialog.displayName = 'LeaveDialog';

export { ShareDialog, type ShareDialogRef };
