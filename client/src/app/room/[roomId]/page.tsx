"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, LogOut, UsersRound } from "lucide-react";
import { toast } from "sonner";

import { Ide } from "@/components/ide";
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
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { socket } from "@/lib/socket";

interface RoomProps {
  params: {
    roomId: string;
  };
}

export default function Room({ params }: RoomProps) {
  const router = useRouter();

  useEffect(() => {
    window.addEventListener("popstate", disconnect);
  }, []);

  function disconnect() {
    console.log("Disconnecting from socket");
    socket().disconnect();
  }

  function handleLeave() {
    disconnect();
    router.push("/");
  }

  const participants = Array.from({ length: 50 }).map(
    (_, i) => `Participant #${i + 1}`,
  );

  return (
    <main className="flex h-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          collapsible
          className="flex flex-col"
        >
          <div className="m-2 flex">
            <UsersRound className="mr-2 size-5" />
            <h2 className="font-medium">Participants</h2>
          </div>
          <ScrollArea className="grow rounded-md">
            <div className="px-2 pr-4">
              {participants.map((participant) => (
                <>
                  <div key={participant} className="text-sm">
                    {participant}
                  </div>
                  <Separator className="my-2" />
                </>
              ))}
            </div>
          </ScrollArea>
          <div className="m-2 flex flex-col gap-y-4">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(params.roomId);
                toast.info("Room ID copied to clipboard.");
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Room ID
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>
                  <LogOut className="mr-2 h-4 w-4" />
                  Leave Room
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to leave this room?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    You can always rejoin this room using the same Room ID. This
                    room will be deleted if you are the last participant.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeave}>
                    Leave
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={80} minSize={50}>
          <Ide />
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
