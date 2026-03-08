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

import { Check, Copy } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ShareDialogProps {
  roomId: string;
}

interface ShareDialogRef {
  closeDialog: () => void;
  openDialog: () => void;
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
      console.error("Failed to copy room ID:", error);
    }
  };

  return (
    <div className="grid w-full items-center gap-1.5">
      <Label className="text-sm" htmlFor="room-id">
        Room ID
      </Label>
      <div className="flex w-full items-center gap-2 rounded-md bg-secondary p-2 md:p-3">
        <code
          className="flex-1 break-all font-medium text-md sm:text-lg md:text-2xl"
          data-testid="room-id-text"
          id="room-id"
        >
          {roomId}
        </code>
        <Button
          aria-label={copied ? "Room ID copied" : "Copy Room ID"}
          className="size-6 shrink-0 hover:bg-secondary-foreground/10 md:size-10"
          data-testid="room-id-copy-button"
          onClick={handleCopy}
          size="icon"
          variant="ghost"
        >
          {copied ? (
            <Check
              aria-hidden="true"
              className="size-4 animate-scale-up-center"
            />
          ) : (
            <Copy aria-hidden="true" className="size-4 animate-fade-in" />
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
      console.error("Failed to copy invite link:", error);
    }
  };

  return (
    <div className="grid w-full items-center gap-1.5">
      <Label className="text-sm" htmlFor="invite-link">
        Invite Link
      </Label>
      <div className="flex w-full items-center gap-2 rounded-md bg-secondary p-2 md:p-3">
        <code
          className="flex-1 break-all font-medium text-md sm:text-lg md:text-2xl"
          data-testid="invite-link-text"
          id="invite-link"
        >
          {`${window.location.origin}/room/${roomId}`}
        </code>
        <Button
          aria-label={copied ? "Invite link copied" : "Copy invite link"}
          className="size-6 shrink-0 hover:bg-secondary-foreground/10 md:size-10"
          data-testid="invite-link-copy-button"
          onClick={handleCopy}
          size="icon"
          variant="ghost"
        >
          {copied ? (
            <Check
              aria-hidden="true"
              className="size-4 animate-scale-up-center"
            />
          ) : (
            <Copy aria-hidden="true" className="size-4 animate-fade-in" />
          )}
        </Button>
      </div>
    </div>
  );
};

const ShareDialog = forwardRef<ShareDialogRef, ShareDialogProps>(
  ({ roomId }, ref) => {
    const isDesktop = useMediaQuery("(min-width: 768px)");
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
            className="rounded-lg"
            imageSettings={{
              src: "/images/codex-logo.svg",
              height: 48,
              width: 48,
              excavate: true,
            }}
            marginSize={2}
            ref={qrCodeRef}
            size={Math.min(256, window.innerWidth - 96)}
            title={`QR code to join room ${roomId}`}
            value={`${window.location.origin}/room/${roomId}`}
          />
        </div>

        {/* Share Sections */}
        <div className="flex flex-1 flex-col space-y-4">
          <RoomIdSection roomId={roomId} />
          {typeof window !== "undefined" && (
            <InviteLinkSection roomId={roomId} />
          )}
        </div>
      </div>
    );

    if (isDesktop) {
      return (
        <Dialog
          aria-label="Share room dialog"
          onOpenChange={setIsOpen}
          open={isOpen}
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
                <Button aria-label="Close share dialog" variant="secondary">
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
        aria-label="Share room drawer"
        onOpenChange={setIsOpen}
        open={isOpen}
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
              <Button aria-label="Close share drawer" variant="secondary">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
);

ShareDialog.displayName = "ShareDialog";

export { ShareDialog, type ShareDialogRef };
