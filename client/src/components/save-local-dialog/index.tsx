import { forwardRef, useCallback, useImperativeHandle, useState } from 'react';

import { useRoomActions } from '@/hooks/useRoomActions';
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

interface SaveLocalDialogProps {
  roomId: string;
}

const DEFAULT_TITLE = 'SAVE_TITLE';
const DEFAULT_DESCRIPTION = 'SAVE_DESCRIPTION';

const SaveLocalDialog = forwardRef(({ roomId }: SaveLocalDialogProps, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  const { handleLeaveRoom } = useRoomActions(roomId);

  const openDialog = useCallback(() => setIsOpen(true), []);
  const closeDialog = useCallback(() => setIsOpen(false), []);

  // Expose openDialog and closeDialog to the parent component
  useImperativeHandle(ref, () => ({
    openDialog,
    closeDialog,
  }));

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{DEFAULT_TITLE}</AlertDialogTitle>
          <AlertDialogDescription>{DEFAULT_DESCRIPTION}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={closeDialog}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleLeaveRoom} asChild>
            <AlertDialogAction>Leave</AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

SaveLocalDialog.displayName = 'SaveLocalDialog';

export { SaveLocalDialog };
