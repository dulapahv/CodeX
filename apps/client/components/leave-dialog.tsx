/**
 * Confirmation dialog component for leaving room.
 * Features:
 * - Responsive dialog/drawer based on screen size
 * - Room leaving confirmation
 * - Leave action handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
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
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRoomActions } from "@/hooks/use-room-actions";

const DEFAULT_TITLE = "Are you sure you want to leave this room?";
const DEFAULT_DESCRIPTION =
  "You can rejoin this room using the same Room ID. If all participants leave, the room will be kept for 5 minutes before being deleted. Use Terminate Room to delete it immediately.";

interface LeaveDialogRef {
  closeDialog: () => void;
  openDialog: () => void;
}

const LeaveDialog = forwardRef<LeaveDialogRef>((_props, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { handleLeaveRoom, handleTerminateRoom } = useRoomActions();

  const openDialog = useCallback(() => setIsOpen(true), []);
  const closeDialog = useCallback(() => setIsOpen(false), []);

  // Expose openDialog and closeDialog to the parent component
  useImperativeHandle(ref, () => ({
    openDialog,
    closeDialog,
  }));

  if (isDesktop) {
    return (
      <Dialog
        aria-label="Leave room dialog"
        onOpenChange={setIsOpen}
        open={isOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{DEFAULT_TITLE}</DialogTitle>
            <DialogDescription>{DEFAULT_DESCRIPTION}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex w-full items-center justify-between sm:justify-between">
            <Button
              aria-label="Terminate room immediately"
              onClick={handleTerminateRoom}
              variant="outline"
            >
              Terminate Room
            </Button>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button aria-label="Cancel leaving room" variant="secondary">
                  Close
                </Button>
              </DialogClose>
              <Button
                aria-label="Confirm leaving room"
                onClick={handleLeaveRoom}
                variant="destructive"
              >
                Leave
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={setIsOpen} open={isOpen}>
      <DrawerContent aria-label="Leave room drawer" role="alertdialog">
        <DrawerHeader>
          <DrawerTitle>{DEFAULT_TITLE}</DrawerTitle>
          <DrawerDescription>{DEFAULT_DESCRIPTION}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button
            aria-label="Confirm leaving room"
            onClick={handleLeaveRoom}
            variant="destructive"
          >
            Leave
          </Button>
          <Button
            aria-label="Terminate room immediately"
            onClick={handleTerminateRoom}
            variant="outline"
          >
            Terminate Room
          </Button>
          <DrawerClose asChild>
            <Button
              aria-label="Cancel leaving room"
              onClick={closeDialog}
              variant="secondary"
            >
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
});

LeaveDialog.displayName = "LeaveDialog";

export { LeaveDialog, type LeaveDialogRef };
