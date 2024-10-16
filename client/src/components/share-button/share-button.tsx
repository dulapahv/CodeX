import { useState } from "react";
import { Check, Copy, Share } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoomProps {
  roomId: string;
}

export function ShareButton({ roomId }: RoomProps) {
  const [copyStatus, setCopyStatus] = useState({
    roomIdCopied: false,
    roomLinkCopied: false,
  });

  function handleCopy(text: string, key: keyof typeof copyStatus) {
    navigator.clipboard.writeText(text);

    // Set the copy status for the specific button
    setCopyStatus((prevState) => ({ ...prevState, [key]: true }));

    // Revert back to false after 2 seconds
    setTimeout(() => {
      setCopyStatus((prevState) => ({ ...prevState, [key]: false }));
    }, 500); // 0.5 second delay
  }

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button size="sm">
              <Share className="mr-2 size-4" />
              Share
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share Room</p>
        </TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Share Room</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {/* Room ID Section */}
              <h2>
                Anyone with this Room ID or link can join and edit code in this
                room.
              </h2>
              <div className="flex flex-col space-y-1.5">
                <Label>Room ID</Label>
                <div className="flex gap-x-2">
                  <Input value={roomId} readOnly />
                  <Button
                    onClick={() => handleCopy(roomId, "roomIdCopied")}
                    size="icon"
                    variant="secondary"
                    className="aspect-square"
                  >
                    {copyStatus.roomIdCopied ? (
                      <Check className="animate-scale-up-center size-4" />
                    ) : (
                      <Copy className="animate-fade-in size-4" />
                    )}
                  </Button>
                </div>
              </div>
              {/* Room Link Section */}
              <div className="flex flex-col space-y-1.5">
                <Label>Room Link</Label>
                <div className="flex gap-x-2">
                  {typeof window !== "undefined" && (
                    <Input
                      value={`${window.location.origin}/room/${roomId}`}
                      readOnly
                    />
                  )}
                  <Button
                    onClick={() =>
                      handleCopy(
                        `${window.location.origin}/room/${roomId}`,
                        "roomLinkCopied",
                      )
                    }
                    size="icon"
                    variant="secondary"
                    className="aspect-square"
                  >
                    {copyStatus.roomLinkCopied ? (
                      <Check className="animate-scale-up-center size-4" />
                    ) : (
                      <Copy className="animate-fade-in size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button asChild>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
