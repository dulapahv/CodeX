/**
 * Confirmation dialog component for leaving room.
 * Features:
 * - Responsive dialog/drawer based on screen size
 * - Room leaving confirmation
 * - Leave action handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import { useMediaQuery } from '@/hooks/use-media-query';
import { useRoomActions } from '@/hooks/use-room-actions';
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

const DEFAULT_TITLE = 'Are you sure you want to leave this room?';
const DEFAULT_DESCRIPTION =
  'You can always rejoin this room using the same Room ID. This room will be deleted if you are the last participant.';

interface LeaveDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

const LeaveDialog = forwardRef<LeaveDialogRef>((props, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { handleLeaveRoom } = useRoomActions();

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
        open={isOpen}
        onOpenChange={setIsOpen}
        aria-label="Leave room dialog"
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{DEFAULT_TITLE}</DialogTitle>
            <DialogDescription>{DEFAULT_DESCRIPTION}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" aria-label="Cancel leaving room">
                Close
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleLeaveRoom}
              aria-label="Confirm leaving room"
            >
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent role="alertdialog" aria-label="Leave room drawer">
        <DrawerHeader>
          <DrawerTitle>{DEFAULT_TITLE}</DrawerTitle>
          <DrawerDescription>{DEFAULT_DESCRIPTION}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <Button
            variant="destructive"
            onClick={handleLeaveRoom}
            aria-label="Confirm leaving room"
          >
            Leave
          </Button>
          <DrawerClose asChild>
            <Button
              variant="secondary"
              onClick={closeDialog}
              aria-label="Cancel leaving room"
            >
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
});

LeaveDialog.displayName = 'LeaveDialog';

export { LeaveDialog, type LeaveDialogRef };
