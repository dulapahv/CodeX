/**
 * Dialog component that confirms user's intention to leave a room.
 * Supports both desktop (Dialog) and mobile (Drawer) presentations.
 *
 * @example
 * ```tsx
 * const dialogRef = useRef<LeaveDialogRef>(null);
 *
 * <LeaveDialog
 *   ref={dialogRef}
 *   roomId="abc123"
 * />
 *
 * // Open dialog programmatically
 * dialogRef.current?.openDialog();
 * ```
 *
 * @param props - Component props
 * @param props.roomId - ID of the current room
 *
 * @remarks
 * Uses the following components:
 * - [`Dialog`](src/components/ui/dialog.tsx) for desktop view
 * - [`Drawer`](src/components/ui/drawer.tsx) for mobile view
 * - [`Button`](src/components/ui/button.tsx) for actions
 *
 * Uses hooks:
 * - [`useMediaQuery`](src/hooks/use-media-query.ts) for responsive layout
 * - [`useRoomActions`](src/hooks/use-room-actions.ts) for room operations
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
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

interface LeaveDialogProps {
  roomId: string;
}

interface LeaveDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

const LeaveDialog = forwardRef<LeaveDialogRef, LeaveDialogProps>(
  ({ roomId }: LeaveDialogProps, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    const isDesktop = useMediaQuery('(min-width: 768px)');
    const { handleLeaveRoom } = useRoomActions(roomId);

    const openDialog = useCallback(() => setIsOpen(true), []);
    const closeDialog = useCallback(() => setIsOpen(false), []);

    // Expose openDialog and closeDialog to the parent component
    useImperativeHandle(ref, () => ({
      openDialog,
      closeDialog,
    }));

    if (isDesktop) {
      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{DEFAULT_TITLE}</DialogTitle>
              <DialogDescription>{DEFAULT_DESCRIPTION}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Close</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleLeaveRoom}>
                Leave
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{DEFAULT_TITLE}</DrawerTitle>
            <DrawerDescription>{DEFAULT_DESCRIPTION}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button variant="destructive" onClick={handleLeaveRoom}>
              Leave
            </Button>
            <DrawerClose asChild>
              <Button variant="secondary" onClick={closeDialog}>
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  },
);

LeaveDialog.displayName = 'LeaveDialog';

export { LeaveDialog, type LeaveDialogRef };
