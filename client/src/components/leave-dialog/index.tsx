import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRoomActions } from "@/hooks/useRoomActions";

interface LeaveDialogProps {
  roomId: string;
}

const DEFAULT_TITLE = "Are you sure you want to leave this room?";
const DEFAULT_DESCRIPTION =
  "You can always rejoin this room using the same Room ID. This room will be deleted if you are the last participant.";

const LeaveDialog = forwardRef(({ roomId }: LeaveDialogProps, ref) => {
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
    <>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{DEFAULT_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>
              {DEFAULT_DESCRIPTION}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDialog}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleLeaveRoom} asChild>
              <AlertDialogAction>Leave</AlertDialogAction>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});

LeaveDialog.displayName = "LeaveDialog";

export default LeaveDialog;
