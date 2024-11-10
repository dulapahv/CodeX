import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import { useMediaQuery } from '@/hooks/use-media-query';
import { useRoomActions } from '@/hooks/use-room-actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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

export interface LeaveDialogRef {
  openDialog: () => void;
  closeDialog: () => void;
}

export const LeaveDialog = forwardRef<LeaveDialogRef, LeaveDialogProps>(
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
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{DEFAULT_TITLE}</AlertDialogTitle>
              <AlertDialogDescription>
                {DEFAULT_DESCRIPTION}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={closeDialog}>
                Cancel
              </AlertDialogCancel>
              <Button variant="destructive" onClick={handleLeaveRoom} asChild>
                <AlertDialogAction>Leave</AlertDialogAction>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen} dismissible={false}>
        <DrawerContent className="first:[&>div]:bg-transparent">
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
