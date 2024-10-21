import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { leaveRoom } from "@/lib/utils";

interface RoomProps {
  roomId: string;
}

export function LeaveButton({ roomId }: RoomProps) {
  const router = useRouter();

  function handleLeave() {
    leaveRoom(roomId);
    router.push("/");
  }

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger
          onFocus={(e) => {
            e.preventDefault();
          }}
          asChild
        >
          <AlertDialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-sm p-0"
            >
              <LogOut className="size-4 text-red-600" strokeWidth={2.5} />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Leave Room</p>
        </TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to leave this room?
          </AlertDialogTitle>
          <AlertDialogDescription>
            You can always rejoin this room using the same Room ID. This room
            will be deleted if you are the last participant.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleLeave} asChild>
            <AlertDialogAction>Leave</AlertDialogAction>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
