import { useState } from "react";
import { Check, Copy, Share } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Share className="mr-2 size-4" />
              Share
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Share Room</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Room</DialogTitle>
          <DialogDescription asChild>
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
                      <Check className="size-4 animate-scale-up-center" />
                    ) : (
                      <Copy className="size-4 animate-fade-in" />
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
                      <Check className="size-4 animate-scale-up-center" />
                    ) : (
                      <Copy className="size-4 animate-fade-in" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild>
            <DialogClose>Close</DialogClose>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
