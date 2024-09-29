"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Avatar } from "@/components/avatar";
import { Monaco } from "@/components/monaco";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { socket } from "@/lib/socket";
import { leaveRoom } from "@/lib/utils";

import { RoomServiceMsg } from "../../../../../common/types/message";

interface RoomProps {
  params: {
    roomId: string;
  };
}

export default function Room({ params }: RoomProps) {
  const router = useRouter();

  const [users, setUsers] = useState<string[]>([]);
  const disconnect = useCallback(() => {
    leaveRoom(params.roomId);
  }, [params.roomId]);

  useEffect(() => {
    if (!socket().connected) {
      router.push(`/?room=${params.roomId}`);
    }

    socket().emit(RoomServiceMsg.GET_USERS, params.roomId);
    socket().on(RoomServiceMsg.UPDATE_CLIENT_LIST, (users: string[]) => {
      setUsers(users);
    });

    window.addEventListener("popstate", disconnect);

    return () => {
      window.removeEventListener("popstate", disconnect);
      socket().off(RoomServiceMsg.UPDATE_CLIENT_LIST);
    };
  }, []);

  function handleLeave() {
    disconnect();
    router.push("/");
  }

  return (
    <main className="flex h-full min-w-[375px] flex-col">
      <div className="bg-[#dddddd] dark:bg-[#3c3c3c]">
        <div className="m-2 flex items-center justify-end gap-x-2">
          <ScrollArea>
            <div className="mr-2 flex gap-x-2">
              {users.map((user, index) => (
                <Avatar key={index} name={user} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(params.roomId);
                  toast.info("Room ID copied to clipboard.");
                }}
              >
                <Copy className="mr-2 size-4" />
                Room ID
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy Room ID</p>
            </TooltipContent>
          </Tooltip>
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <LogOut className="size-4" />
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
                  You can always rejoin this room using the same Room ID. This
                  room will be deleted if you are the last participant.
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
        </div>
      </div>
      <Monaco />
    </main>
  );
}
