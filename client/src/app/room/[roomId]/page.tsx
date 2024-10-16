"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Braces } from "lucide-react";

import { LeaveButton } from "@/components/leave-button";
import { Monaco } from "@/components/monaco";
import { SettingSheet } from "@/components/settings-sheet";
import { ShareButton } from "@/components/share-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserList } from "@/components/user-list";
import { socket } from "@/lib/socket";
import { leaveRoom } from "@/lib/utils";

import {
  CodeServiceMsg,
  RoomServiceMsg,
} from "../../../../../common/types/message";

interface RoomProps {
  params: {
    roomId: string;
  };
}

export default function Room({ params }: RoomProps) {
  const router = useRouter();

  const [users, setUsers] = useState<string[]>([]);
  const [defaultCode, setDefaultCode] = useState<string | null>(null);

  const disconnect = useCallback(() => {
    leaveRoom(params.roomId);
  }, [params.roomId]);

  useEffect(() => {
    if (!socket().connected) {
      router.push(`/?room=${params.roomId}`);
    }

    sessionStorage.setItem("roomId", params.roomId);

    socket().emit(RoomServiceMsg.GET_USERS, params.roomId);
    socket().on(RoomServiceMsg.UPDATE_CLIENT_LIST, (users: string[]) => {
      setUsers(users);
    });

    socket().emit(CodeServiceMsg.GET_CODE, params.roomId);
    socket().on(CodeServiceMsg.RECEIVE_CODE, (code: string) => {
      setDefaultCode(code);
    });

    window.addEventListener("popstate", disconnect);

    return () => {
      window.removeEventListener("popstate", disconnect);
      socket().off(RoomServiceMsg.UPDATE_CLIENT_LIST);
      socket().off(CodeServiceMsg.RECEIVE_CODE);
    };
  }, []);

  return (
    <main className="flex h-full min-w-[375px] flex-col">
      <div className="bg-[#dddddd] dark:bg-[#3c3c3c]">
        <div className="m-2 flex items-center justify-end gap-x-2">
          <UserList users={users} />
          <ShareButton roomId={params.roomId} />
          <SettingSheet />
          <LeaveButton roomId={params.roomId} />
        </div>
      </div>
      {defaultCode !== null ? (
        <Monaco defaultCode={defaultCode} />
      ) : (
        <div className="animate-fade-in flex h-full items-center justify-center">
          <Alert className="max-w-md">
            <Braces className="size-4" />
            <AlertTitle>Loading session</AlertTitle>
            <AlertDescription>
              Loading your coding session. Please wait...
            </AlertDescription>
          </Alert>
        </div>
      )}
    </main>
  );
}
